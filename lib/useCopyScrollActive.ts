'use client'

import { useChapterNav } from '@/components/ChapterNavProvider'
import { isFlowChapterId } from '@/lib/chapterFlow'
import { chapterRevealForId } from '@/lib/chapterSlideshow'

export function useCopyScrollActive(chapterId: string): boolean {
  const { activeSlideId } = useChapterNav()
  if (activeSlideId === chapterId) return true
  if (isFlowChapterId(chapterId) && chapterRevealForId(chapterId) >= 1) {
    return true
  }
  return false
}
