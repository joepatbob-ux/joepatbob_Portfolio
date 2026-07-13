import { chapterRevealsChanged } from '@/lib/scroll/chapterReveals'
import { applySlideScrollFromMeasure } from '@/lib/scroll/applySlideScrollFromMeasure'
import {
  hideAllChapterPanelsForNav,
  resetInFlowChapterPanels,
  resetNavChapterPanelStyles,
} from '@/lib/scroll/applyChapterPanelScrollStyles'
import { isContinuousChapters } from '@/lib/scroll/continuousChapters'
import {
  measureSlideScrollState,
  type SlideNavPhase,
} from '@/lib/scroll/scrollOrchestration'
import { useChapterCopyWheelTrap } from '@/lib/scroll/chapterCopyWheel'
import {
  resetChapterCopyScrollersAfterSnap,
  waitForChapterScrollSettle,
} from '@/lib/scroll/chapterCopyScrollReset'
import {
  chapterSlotScrollTop,
  scrollDocumentToChapterSlot,
} from '@/lib/scroll/chapterSnapScroll'
import { requestChapterMount } from '@/lib/scroll/chapterMount'
import { waitForChapterSlotReady } from '@/lib/chapterNav/waitForChapterSlot'
import { sectionEntryChapterId } from '@/lib/sectionEntryChapter'
import { flushScrollFrame, scheduleScrollFrame } from '@/lib/scroll/scrollFrame'
import { bindTopBarScrollSpy } from '@/lib/scroll/topBarScrollSpy'
import { LAYOUT_MQ } from '@/lib/layout/breakpoints'
import { isTopBarNavViewport } from '@/lib/layout/isTopBarNavViewport'
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { flushSync } from 'react-dom'

export const CHAPTER_NAV_FADE_IN_MS = 360

/** @deprecated Use CHAPTER_NAV_FADE_IN_MS */
export const CHAPTER_NAV_FADE_MS = CHAPTER_NAV_FADE_IN_MS

export type ChapterNavPhase = SlideNavPhase

interface ChapterNavContextValue {
  phase: ChapterNavPhase
  targetId: string | null
  /** After phase `in`, one frame at opacity 0 before the fade runs. */
  navFadeInArmed: boolean
  activeSlideId: string | null
  reveals: Readonly<Record<string, number>>
  navigateToChapter: (chapterId: string) => Promise<void>
  navigateToSection: (sectionId: string) => Promise<void>
}

const ChapterNavContext = createContext<ChapterNavContextValue | null>(null)

function sleep(ms: number) {
  return new Promise<void>((resolve) => {
    window.setTimeout(resolve, ms)
  })
}

/** Two frames so phase `out` opacity commits before scroll. */
function waitForPaint() {
  return new Promise<void>((resolve) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => resolve())
    })
  })
}

export function ChapterNavProvider({ children }: { children: ReactNode }) {
  const [phase, setPhase] = useState<ChapterNavPhase>('idle')
  const [targetId, setTargetId] = useState<string | null>(null)
  const [navFadeInArmed, setNavFadeInArmed] = useState(false)
  const [activeSlideId, setActiveSlideId] = useState<string | null>(null)
  const [reveals, setReveals] = useState<Record<string, number>>({})
  const busyRef = useRef(false)
  const navGuardRef = useRef<{ chapterId: string; until: number } | null>(null)
  const activeRef = useRef<string | null>(null)
  const targetIdRef = useRef<string | null>(null)
  const revealsRef = useRef<Record<string, number>>({})
  const phaseRef = useRef<ChapterNavPhase>('idle')
  useEffect(() => {
    activeRef.current = activeSlideId
  }, [activeSlideId])

  useEffect(() => {
    phaseRef.current = phase
  }, [phase])

  useEffect(() => {
    targetIdRef.current = targetId
  }, [targetId])

  useChapterCopyWheelTrap()

  useEffect(() => {
    const applyScrollState = (state: ReturnType<typeof measureSlideScrollState>) => {
      if (phaseRef.current === 'idle' && isTopBarNavViewport()) {
        revealsRef.current = state.revealMap
        if (!busyRef.current) {
          let best = state.activeSlideId
          const guard = navGuardRef.current
          if (guard && performance.now() < guard.until && !state.inHero) {
            const slot = document.querySelector<HTMLElement>(
              `.portfolio-chapter-slot[data-chapter-id="${CSS.escape(guard.chapterId)}"]`,
            )
            if (
              slot &&
              Math.abs(window.scrollY - chapterSlotScrollTop(slot)) <= 24
            ) {
              best = guard.chapterId
            }
          }

          if (best !== activeRef.current) {
            activeRef.current = best
          }
        }
        return
      }

      if (phaseRef.current === 'idle') {
        // Hot scroll path: context consumers only read `reveals` during nav
        // transitions, so idle scroll keeps the ref fresh without a React
        // re-render per step. runNavigate snapshots the ref into state.
        revealsRef.current = state.revealMap
      } else if (state.inHero || phaseRef.current === 'out') {
        if (Object.keys(revealsRef.current).length > 0) {
          revealsRef.current = {}
          setReveals({})
        }
      } else if (chapterRevealsChanged(revealsRef.current, state.revealMap)) {
        revealsRef.current = state.revealMap
        setReveals(state.revealMap)
      }

      if (!busyRef.current) {
        let best = state.activeSlideId
        const guard = navGuardRef.current
        if (guard && performance.now() < guard.until && !state.inHero) {
          const slot = document.querySelector<HTMLElement>(
            `.portfolio-chapter-slot[data-chapter-id="${CSS.escape(guard.chapterId)}"]`,
          )
          if (
            slot &&
            Math.abs(window.scrollY - chapterSlotScrollTop(slot)) <= 24
          ) {
            best = guard.chapterId
          }
        }

        if (best !== activeRef.current) {
          activeRef.current = best
          setActiveSlideId(best)
        }
      }
    }

    const measureAndApplySlides = () => {
      if (busyRef.current) return

      const state = applySlideScrollFromMeasure(
        phaseRef.current,
        busyRef.current ? targetIdRef.current : null,
        busyRef.current ? null : navGuardRef.current,
      )
      applyScrollState(state)
    }

    let cleanup: (() => void) | undefined

    const bindScrollOrchestration = () => {
      cleanup?.()
      cleanup = undefined

      if (window.matchMedia(LAYOUT_MQ.topBarNav).matches) {
        resetInFlowChapterPanels()
        cleanup = bindTopBarScrollSpy(
          () => phaseRef.current,
          () => (busyRef.current ? targetIdRef.current : null),
          applyScrollState,
        )
        return
      }

      if (isContinuousChapters()) {
        resetInFlowChapterPanels()
        measureAndApplySlides()
        cleanup = scheduleScrollFrame(measureAndApplySlides)
        return
      }

      measureAndApplySlides()
      cleanup = scheduleScrollFrame(measureAndApplySlides)
    }

    bindScrollOrchestration()
    const mq = window.matchMedia(LAYOUT_MQ.topBarNav)
    mq.addEventListener('change', bindScrollOrchestration)

    return () => {
      mq.removeEventListener('change', bindScrollOrchestration)
      cleanup?.()
    }
  }, [])

  const runNavigate = useCallback(
    async (selector: string, chapterId: string) => {
      if (busyRef.current) return

      requestChapterMount(chapterId)

      let target = await waitForChapterSlotReady(chapterId)

      if (!target) {
        target = document.querySelector<HTMLElement>(selector)
      }

      if (!target && chapterId.endsWith('-overview')) {
        const overviewSectionId = chapterId.slice(0, -'-overview'.length)
        target = document.querySelector<HTMLElement>(
          `article[data-section-id="${CSS.escape(overviewSectionId)}"] .portfolio-chapter-slot[data-chapter-id="${CSS.escape(chapterId)}"]`,
        )
      }

      if (!target) {
        if (import.meta.env.DEV) {
          console.warn(
            `[ChapterNav] No element for selector "${selector}" (chapter ${chapterId})`,
          )
        }
        return
      }

      if (isContinuousChapters() && !isTopBarNavViewport()) {
        busyRef.current = true
        activeRef.current = chapterId
        setActiveSlideId(chapterId)

        scrollDocumentToChapterSlot(target)
        await waitForChapterScrollSettle(target)
        if (Math.abs(window.scrollY - chapterSlotScrollTop(target)) > 8) {
          scrollDocumentToChapterSlot(target)
          await waitForChapterScrollSettle(target)
        }

        navGuardRef.current = {
          chapterId,
          until: performance.now() + CHAPTER_NAV_FADE_IN_MS + 200,
        }
        busyRef.current = false
        applySlideScrollFromMeasure('idle', chapterId, navGuardRef.current)
        flushScrollFrame()
        requestAnimationFrame(() => {
          applySlideScrollFromMeasure('idle', null, navGuardRef.current)
          flushScrollFrame()
        })
        return
      }

      // Legacy fixed-slideshow nav: React panel crossfade.
      busyRef.current = true
      hideAllChapterPanelsForNav()
      flushSync(() => {
        setTargetId(chapterId)
        setNavFadeInArmed(false)
        setReveals({})
        revealsRef.current = {}
        setPhase('out')
      })
      applySlideScrollFromMeasure('out', null, null)
      flushScrollFrame()
      await waitForPaint()

      scrollDocumentToChapterSlot(target)
      await waitForChapterScrollSettle(target)
      if (Math.abs(window.scrollY - chapterSlotScrollTop(target)) > 8) {
        scrollDocumentToChapterSlot(target)
        await waitForChapterScrollSettle(target)
      }
      resetChapterCopyScrollersAfterSnap()

      flushSync(() => {
        activeRef.current = chapterId
        setActiveSlideId(chapterId)
        setPhase('in')
      })
      await waitForPaint()
      flushSync(() => {
        setNavFadeInArmed(true)
      })
      applySlideScrollFromMeasure('in', chapterId, null)
      flushScrollFrame()

      await sleep(CHAPTER_NAV_FADE_IN_MS)

      navGuardRef.current = {
        chapterId,
        until: performance.now() + CHAPTER_NAV_FADE_IN_MS + 120,
      }
      flushSync(() => {
        setPhase('idle')
        setTargetId(null)
        setNavFadeInArmed(false)
      })
      resetNavChapterPanelStyles()
      applySlideScrollFromMeasure('idle', chapterId, navGuardRef.current)
      flushScrollFrame()
      busyRef.current = false
      requestAnimationFrame(() => {
        applySlideScrollFromMeasure('idle', null, navGuardRef.current)
        flushScrollFrame()
      })
    },
    [],
  )

  const navigateToChapter = useCallback(
    (chapterId: string) =>
      runNavigate(
        `.portfolio-chapter-slot[data-chapter-id="${chapterId}"]`,
        chapterId,
      ),
    [runNavigate],
  )

  const navigateToSection = useCallback(
    (sectionId: string) => {
      const entryId = sectionEntryChapterId(sectionId)
      return runNavigate(
        `.portfolio-chapter-slot[data-chapter-id="${entryId}"]`,
        entryId,
      )
    },
    [runNavigate],
  )

  const value = useMemo(
    () => ({
      phase,
      targetId,
      navFadeInArmed,
      activeSlideId,
      reveals,
      navigateToChapter,
      navigateToSection,
    }),
    [phase, targetId, navFadeInArmed, activeSlideId, reveals, navigateToChapter, navigateToSection],
  )

  return (
    <ChapterNavContext.Provider value={value}>
      {children}
    </ChapterNavContext.Provider>
  )
}

export function useChapterNav() {
  const ctx = useContext(ChapterNavContext)
  if (!ctx) {
    throw new Error('useChapterNav must be used within ChapterNavProvider')
  }
  return ctx
}
