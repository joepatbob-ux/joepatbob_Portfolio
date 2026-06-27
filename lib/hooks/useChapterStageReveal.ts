'use client'

import { useChapterNav } from '@/components/ChapterNavProvider'
import { isContinuousChapters } from '@/lib/continuousChapters'
import {
  chapterStageRevealForId,
  subscribeChapterScrollState,
} from '@/lib/chapterSlideshow'
import { useSyncExternalStore } from 'react'

/** Scroll-driven stage visibility (0–1) — lags copy on exit in continuous mode. */
export function useChapterStageReveal(chapterId: string): number {
  const nav = useChapterNav()
  const published = useSyncExternalStore(
    subscribeChapterScrollState,
    () => chapterStageRevealForId(chapterId),
    () => 0,
  )

  if (nav?.phase !== 'idle') {
    return nav.reveals[chapterId] ?? 0
  }

  if (isContinuousChapters()) {
    return published
  }

  return published
}
