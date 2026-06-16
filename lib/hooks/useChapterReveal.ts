'use client'

import { useChapterNav } from '@/components/ChapterNavProvider'
import { isContinuousChapters } from '@/lib/continuousChapters'
import { chapterRevealForId } from '@/lib/chapterSlideshow'
import { useLayoutTopBarNav } from '@/lib/hooks/useLayoutTopBarNav'

/** Scroll-driven visibility for a chapter (0–1). */
export function useChapterReveal(chapterId: string): number {
  const nav = useChapterNav()
  const topBarNav = useLayoutTopBarNav()

  if (nav?.phase === 'idle' && (topBarNav || isContinuousChapters())) {
    return nav.reveals[chapterId] ?? 0
  }

  return chapterRevealForId(chapterId)
}
