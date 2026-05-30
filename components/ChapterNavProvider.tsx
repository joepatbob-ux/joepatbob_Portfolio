'use client'

import { chapterRevealsChanged } from '@/lib/chapterReveals'
import {
  measureSlideScrollState,
  publishSlideScrollState,
  type SlideNavPhase,
} from '@/lib/scrollOrchestration'
import { useChapterCopyWheelTrap } from '@/lib/chapterCopyWheel'
import { waitForChapterSlot } from '@/lib/chapterNav/waitForChapterSlot'
import { sectionEntryChapterId } from '@/lib/sectionEntryChapter'
import { flushScrollFrame, scheduleScrollFrame } from '@/lib/scrollFrame'
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

export function ChapterNavProvider({ children }: { children: ReactNode }) {
  const [phase, setPhase] = useState<ChapterNavPhase>('idle')
  const [targetId, setTargetId] = useState<string | null>(null)
  const [activeSlideId, setActiveSlideId] = useState<string | null>(null)
  const [reveals, setReveals] = useState<Record<string, number>>({})
  const busyRef = useRef(false)
  const activeRef = useRef<string | null>(null)
  const revealsRef = useRef<Record<string, number>>({})
  const phaseRef = useRef<ChapterNavPhase>('idle')
  useEffect(() => {
    activeRef.current = activeSlideId
  }, [activeSlideId])

  useEffect(() => {
    phaseRef.current = phase
  }, [phase])

  useChapterCopyWheelTrap()

  useEffect(() => {
    const measureSlides = () => {
      const state = measureSlideScrollState(phaseRef.current)
      publishSlideScrollState(state)

      if (state.inHero || phaseRef.current === 'out') {
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
          setActiveSlideId(best)
        }
      }

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
      setPhase('out')
      await sleep(CHAPTER_NAV_FADE_MS)

      target.scrollIntoView({ behavior: 'auto', block: 'start' })
      flushScrollFrame()
      await sleep(32)

      activeRef.current = chapterId
      setActiveSlideId(chapterId)
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
