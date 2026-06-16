'use client'

import { chapterRevealsChanged } from '@/lib/chapterReveals'
import { applySlideScrollFromMeasure } from '@/lib/applySlideScrollFromMeasure'
import { resetInFlowChapterPanels } from '@/lib/applyChapterPanelScrollStyles'
import { isContinuousChapters } from '@/lib/continuousChapters'
import {
  measureSlideScrollState,
  type SlideNavPhase,
} from '@/lib/scrollOrchestration'
import { useChapterCopyWheelTrap } from '@/lib/chapterCopyWheel'
import {
  resetChapterCopyScrollersAfterSnap,
  waitForChapterScrollSettle,
} from '@/lib/chapterCopyScrollReset'
import {
  chapterSlotScrollTop,
  scrollDocumentToChapterSlot,
} from '@/lib/chapterSnapScroll'
import { requestChapterMount } from '@/lib/chapterMount'
import { waitForChapterSlotReady } from '@/lib/chapterNav/waitForChapterSlot'
import { sectionEntryChapterId } from '@/lib/sectionEntryChapter'
import { flushScrollFrame, scheduleScrollFrame } from '@/lib/scrollFrame'
import { bindTopBarScrollSpy } from '@/lib/topBarScrollSpy'
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

export const CHAPTER_NAV_FADE_MS = 520

export type ChapterNavPhase = SlideNavPhase

interface ChapterNavContextValue {
  phase: ChapterNavPhase
  targetId: string | null
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

/** Two frames so opacity:0 from phase `out` is painted before scroll. */
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
      if (phaseRef.current === 'idle') {
        if (
          (isTopBarNavViewport() || isContinuousChapters()) &&
          chapterRevealsChanged(revealsRef.current, state.revealMap)
        ) {
          revealsRef.current = state.revealMap
          setReveals(state.revealMap)
        } else {
          revealsRef.current = state.revealMap
        }
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
        if (guard && performance.now() < guard.until) {
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

      if (
        window.matchMedia(LAYOUT_MQ.topBarNav).matches ||
        isContinuousChapters()
      ) {
        resetInFlowChapterPanels()
        cleanup = bindTopBarScrollSpy(
          () => phaseRef.current,
          () => (busyRef.current ? targetIdRef.current : null),
          applyScrollState,
        )
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

      busyRef.current = true
      setTargetId(chapterId)
      activeRef.current = chapterId
      setActiveSlideId(chapterId)

      setPhase('out')
      await waitForPaint()

      scrollDocumentToChapterSlot(target)
      await waitForChapterScrollSettle(target)
      if (Math.abs(window.scrollY - chapterSlotScrollTop(target)) > 8) {
        scrollDocumentToChapterSlot(target)
        await waitForChapterScrollSettle(target)
      }
      resetChapterCopyScrollersAfterSnap()
      applySlideScrollFromMeasure('in', chapterId, null)
      flushScrollFrame()

      setPhase('in')
      await sleep(CHAPTER_NAV_FADE_MS)

      navGuardRef.current = {
        chapterId,
        until: performance.now() + 720,
      }
      busyRef.current = false
      setPhase('idle')
      setTargetId(null)
      // Lock destination reveal before React clears transition inline styles.
      applySlideScrollFromMeasure('idle', chapterId, navGuardRef.current)
      flushScrollFrame()
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
      activeSlideId,
      reveals,
      navigateToChapter,
      navigateToSection,
    }),
    [phase, targetId, activeSlideId, reveals, navigateToChapter, navigateToSection],
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
