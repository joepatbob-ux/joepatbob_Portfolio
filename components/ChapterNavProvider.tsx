'use client'

import { chapterRevealsChanged } from '@/lib/chapterReveals'
import {
  applyChapterPanelScrollStyles,
  applyPlacedStickerScrollVisibility,
  resetInFlowChapterPanels,
} from '@/lib/applyChapterPanelScrollStyles'
import {
  measureSlideScrollState,
  publishSlideScrollState,
  type SlideNavPhase,
} from '@/lib/scrollOrchestration'
import { useChapterCopyWheelTrap } from '@/lib/chapterCopyWheel'
import { waitForChapterSlot } from '@/lib/chapterNav/waitForChapterSlot'
import { sectionEntryChapterId } from '@/lib/sectionEntryChapter'
import { flushScrollFrame, scheduleScrollFrame } from '@/lib/scrollFrame'
import { bindTopBarScrollSpy } from '@/lib/topBarScrollSpy'
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
  const activeRef = useRef<string | null>(null)
  const targetIdRef = useRef<string | null>(null)
  const revealsRef = useRef<Record<string, number>>({})
  const phaseRef = useRef<ChapterNavPhase>('idle')
  const lastScrollActiveRef = useRef<string | null>(null)
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
    if (isTopBarNavViewport()) {
      resetInFlowChapterPanels()
    }
  }, [])

  useEffect(() => {
    const applyScrollState = (state: ReturnType<typeof measureSlideScrollState>) => {
      if (phaseRef.current === 'idle') {
        if (!isTopBarNavViewport()) {
          applyChapterPanelScrollStyles(state.revealMap, state.activeSlideId)
        }
        if (state.activeSlideId !== lastScrollActiveRef.current) {
          lastScrollActiveRef.current = state.activeSlideId
          applyPlacedStickerScrollVisibility(state.revealMap, state.activeSlideId)
        }
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
        const best = state.activeSlideId
        if (best && best !== activeRef.current) {
          activeRef.current = best
          if (!isTopBarNavViewport()) {
            setActiveSlideId(best)
          }
        }
      }
    }

    if (isTopBarNavViewport()) {
      return bindTopBarScrollSpy(
        () => phaseRef.current,
        () => (busyRef.current ? targetIdRef.current : null),
        applyScrollState,
      )
    }

    const measureSlides = () => {
      const lockId = busyRef.current ? targetIdRef.current : null
      const state = measureSlideScrollState(phaseRef.current, lockId)
      publishSlideScrollState(state)
      applyScrollState(state)
    }

    return scheduleScrollFrame(measureSlides)
  }, [])

  const runNavigate = useCallback(
    async (selector: string, chapterId: string) => {
      if (busyRef.current) return

      let target =
        document.querySelector<HTMLElement>(selector) ??
        (await waitForChapterSlot(chapterId))

      if (!target && chapterId.endsWith('-overview')) {
        const sectionId = chapterId.slice(0, -'-overview'.length)
        target = document.querySelector<HTMLElement>(
          `article[data-section-id="${CSS.escape(sectionId)}"]`,
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

      target.scrollIntoView({ behavior: 'auto', block: 'start' })
      flushScrollFrame()

      setPhase('in')
      await sleep(CHAPTER_NAV_FADE_MS)

      setPhase('idle')
      setTargetId(null)
      busyRef.current = false
      flushScrollFrame()
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
