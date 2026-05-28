'use client'

import { useChapterNav } from '@/components/ChapterNavProvider'
import { isFlowChapterId } from '@/lib/chapterFlow'

export function useCopyScrollActive(chapterId: string): boolean {
  const { activeSlideId, reveals } = useChapterNav()
  if (activeSlideId === chapterId) return true
  if (isFlowChapterId(chapterId) && (reveals[chapterId] ?? 0) >= 1) return true
  return false
}
