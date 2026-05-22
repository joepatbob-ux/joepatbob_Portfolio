'use client'

import { useChapterNav } from '@/components/ChapterNavProvider'

/** Only the viewport-centered snap slide should trap wheel → in-slide copy scroll. */
export function useCopyScrollActive(chapterId: string): boolean {
  const { activeSlideId } = useChapterNav()
  return activeSlideId === chapterId
}
