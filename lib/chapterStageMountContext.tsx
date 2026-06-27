'use client'

import { isDeferredChapter, useChapterMount } from '@/lib/chapterMount'
import {
  CHAPTER_INTERACTIVE_VISIBILITY,
  CHAPTER_STAGE_PAINT_VISIBILITY,
} from '@/lib/chapterVisibility'
import { isContinuousChapters } from '@/lib/continuousChapters'
import { useChapterReveal } from '@/lib/hooks/useChapterReveal'
import { useChapterStageReveal } from '@/lib/hooks/useChapterStageReveal'
import { createContext, useContext, type ReactNode, type RefObject } from 'react'

const ChapterStageReadyContext = createContext(true)

/** Latched once true in continuous mode — avoids unmounting canvas/WebGL on scroll exit. */
const latchedStageReady = new Set<string>()

export function ChapterStageMountProvider({
  chapterId,
  rootRef,
  children,
}: {
  chapterId: string
  rootRef: RefObject<HTMLElement | null>
  children: ReactNode
}) {
  const immediate = !isDeferredChapter(chapterId)
  const continuous = isContinuousChapters()
  const copyReveal = useChapterReveal(chapterId)
  const stageReveal = useChapterStageReveal(chapterId)
  const ioReady = useChapterMount(chapterId, rootRef, immediate)

  const readyNow = continuous
    ? (immediate || ioReady) &&
      copyReveal >= CHAPTER_INTERACTIVE_VISIBILITY &&
      stageReveal >= CHAPTER_STAGE_PAINT_VISIBILITY
    : immediate || ioReady

  if (readyNow) {
    latchedStageReady.add(chapterId)
  }

  const stageReady = continuous
    ? latchedStageReady.has(chapterId)
    : readyNow

  return (
    <ChapterStageReadyContext.Provider value={stageReady}>
      {children}
    </ChapterStageReadyContext.Provider>
  )
}

/** IO + reveal-gated hardware stage mount; copy renders regardless. Defaults true outside provider. */
export function useChapterStageReady(): boolean {
  return useContext(ChapterStageReadyContext)
}
