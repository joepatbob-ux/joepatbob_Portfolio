'use client'

import { pickActiveSlideId } from '@/lib/chapterSlideshow'
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

export type ChapterNavPhase = 'idle' | 'out' | 'in'

interface ChapterNavContextValue {
  phase: ChapterNavPhase
  targetId: string | null
  activeSlideId: string | null
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
  const busyRef = useRef(false)
  const activeRef = useRef<string | null>(null)

  useEffect(() => {
    activeRef.current = activeSlideId
  }, [activeSlideId])

  useEffect(() => {
    let raf = 0

    const syncActiveFromScroll = () => {
      if (busyRef.current || phase !== 'idle') return
      const next = pickActiveSlideId()
      if (next && next !== activeRef.current) {
        activeRef.current = next
        setActiveSlideId(next)
      }
    }

    const onScroll = () => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(syncActiveFromScroll)
    }

    syncActiveFromScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll, { passive: true })

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [phase])

  const runNavigate = useCallback(
    async (selector: string, chapterId: string) => {
      if (busyRef.current) return
      const target = document.querySelector<HTMLElement>(selector)
      if (!target) return

      busyRef.current = true
      setTargetId(chapterId)
      setPhase('out')
      await sleep(CHAPTER_NAV_FADE_MS)

      target.scrollIntoView({ behavior: 'auto', block: 'start' })
      window.dispatchEvent(new Event('scroll'))
      await sleep(32)

      activeRef.current = chapterId
      setActiveSlideId(chapterId)
      setPhase('in')
      await sleep(CHAPTER_NAV_FADE_MS)

      setPhase('idle')
      setTargetId(null)
      busyRef.current = false
    },
    [],
  )

  const navigateToChapter = useCallback(
    (chapterId: string) =>
      runNavigate(`[data-chapter-id="${chapterId}"]`, chapterId),
    [runNavigate],
  )

  const navigateToSection = useCallback(
    (sectionId: string) => {
      const overviewId = `${sectionId}-overview`
      return runNavigate(`[data-chapter-id="${overviewId}"]`, overviewId)
    },
    [runNavigate],
  )

  const value = useMemo(
    () => ({
      phase,
      targetId,
      activeSlideId,
      navigateToChapter,
      navigateToSection,
    }),
    [phase, targetId, activeSlideId, navigateToChapter, navigateToSection],
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
