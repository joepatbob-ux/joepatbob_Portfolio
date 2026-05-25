'use client'

import { CHAPTER_NAV_FADE_MS, useChapterNav } from '@/components/ChapterNavProvider'
import { LAYOUT_MQ } from '@/lib/layout/breakpoints'
import { SCROLL_BLUR_PX, blurOutFromReveal } from '@/lib/scrollBlur'

const SCROLL_EASE = 'cubic-bezier(0.16, 1, 0.3, 1)'

export function useChapterPanelOpacity(chapterId: string) {
  const { phase, targetId, activeSlideId, reveals } = useChapterNav()

  const scrollReveal = reveals[chapterId] ?? 0

  let reveal = scrollReveal
  let isActive = scrollReveal > 0.5

  if (phase === 'out') {
    reveal = 0
    isActive = false
  } else if (phase === 'in') {
    const entering = chapterId === targetId
    reveal = entering ? 1 : 0
    isActive = entering
  } else if (activeSlideId === chapterId) {
    const mobileFlow =
      typeof window !== 'undefined' &&
      window.matchMedia(LAYOUT_MQ.mobile).matches
    isActive = mobileFlow ? scrollReveal > 0 : scrollReveal > 0.25
  }

  const { opacity, filter } = blurOutFromReveal(reveal, SCROLL_BLUR_PX)
  const transitioning = phase === 'out' || phase === 'in'

  return {
    opacity,
    isActive,
    style: {
      opacity,
      filter,
      /* Stay below --z-stickers (105); only order panels relative to each other */
      zIndex: opacity > 0.08 ? Math.round(1 + scrollReveal) : 0,
      pointerEvents: isActive ? 'auto' : 'none',
      transition: transitioning
        ? `opacity ${CHAPTER_NAV_FADE_MS}ms ${SCROLL_EASE}, filter ${CHAPTER_NAV_FADE_MS}ms ${SCROLL_EASE}`
        : 'none',
    } as const,
  }
}
