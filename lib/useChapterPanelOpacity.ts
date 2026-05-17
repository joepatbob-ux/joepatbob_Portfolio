'use client'

import {
  CHAPTER_NAV_FADE_MS,
  useChapterNav,
} from '@/components/ChapterNavProvider'

const SCROLL_EASE = 'cubic-bezier(0.16, 1, 0.3, 1)'

export function useChapterPanelOpacity(chapterId: string) {
  const { phase, targetId, activeSlideId } = useChapterNav()

  let opacity = 0
  let isActive = false

  if (phase === 'out') {
    opacity = 0
  } else if (phase === 'in') {
    opacity = chapterId === targetId ? 1 : 0
    isActive = chapterId === targetId
  } else {
    isActive = chapterId === activeSlideId
    opacity = isActive ? 1 : 0
  }

  return {
    opacity,
    isActive,
    style: {
      opacity,
      zIndex: isActive ? 2 : 0,
      pointerEvents: isActive ? 'auto' : 'none',
      transition: `opacity ${CHAPTER_NAV_FADE_MS}ms ${SCROLL_EASE}`,
    } as const,
  }
}
