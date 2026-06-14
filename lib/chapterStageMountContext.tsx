'use client'

import { isDeferredChapter, useChapterMount } from '@/lib/chapterMount'
import { createContext, useContext, type ReactNode, type RefObject } from 'react'

const ChapterStageReadyContext = createContext(true)

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
  const stageReady = useChapterMount(chapterId, rootRef, immediate)

  return (
    <ChapterStageReadyContext.Provider value={stageReady}>
      {children}
    </ChapterStageReadyContext.Provider>
  )
}

/** IO-gated hardware stage mount; copy renders regardless. Defaults true outside provider. */
export function useChapterStageReady(): boolean {
  return useContext(ChapterStageReadyContext)
}
