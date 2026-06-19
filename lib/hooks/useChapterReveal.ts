'use client'

import { useChapterNav } from '@/components/ChapterNavProvider'
import { isContinuousChapters } from '@/lib/continuousChapters'
import {
  activeSlideIdPublished,
  chapterRevealForId,
  subscribeChapterScrollState,
} from '@/lib/chapterSlideshow'
import { useSyncExternalStore } from 'react'

/** Scroll-driven visibility for a chapter (0–1). */
export function useChapterReveal(chapterId: string): number {
  const nav = useChapterNav()
  const published = useSyncExternalStore(
    subscribeChapterScrollState,
    () => chapterRevealForId(chapterId),
    () => 0,
  )

  if (nav?.phase !== 'idle') {
    return nav.reveals[chapterId] ?? 0
  }

  if (isContinuousChapters()) {
    return nav.reveals[chapterId] ?? 0
  }

  return published
}

/** Active chapter from scroll spy — avoids context re-renders on mobile/tablet. */
export function usePublishedActiveSlideId(): string | null {
  return useSyncExternalStore(
    subscribeChapterScrollState,
    activeSlideIdPublished,
    () => null,
  )
}
