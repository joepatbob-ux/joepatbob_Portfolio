'use client'

import { useChapterNav } from '@/components/ChapterNavProvider'
import { chapterSlotAtScrollY } from '@/lib/chapterSnapScroll'

/** True when this chapter's copy column should receive wheel + reset to top on entry. */
export function useCopyScrollActive(chapterId: string): boolean {
  const { activeSlideId, phase, targetId } = useChapterNav()

  if (phase === 'in' || phase === 'out') {
    return targetId === chapterId || activeSlideId === chapterId
  }

  const slot = chapterSlotAtScrollY()
  return slot?.dataset.chapterId === chapterId
}
