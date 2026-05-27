'use client'

import { useChapterNav } from '@/components/ChapterNavProvider'
import { isFlowChapterId } from '@/lib/chapterFlow'

/**
 * Snap slides: only the active slide resets copy scroll.
 * In-flow chapters: any fully visible section (reveal === 1).
 */
export function useCopyScrollActive(chapterId: string): boolean {
  const { activeSlideId, reveals } = useChapterNav()
  if (activeSlideId === chapterId) return true

  if (isFlowChapterId(chapterId) && (reveals[chapterId] ?? 0) >= 1) {
    return true
  }

  return false
}
