'use client'

import { CHAPTER_NAV_FADE_MS, useChapterNav } from '@/components/ChapterNavProvider'
import { isFixedSlideshowFlowChapter, isFlowChapterId } from '@/lib/chapterFlow'
import { SCROLL_BLUR_PX, blurOutFromReveal } from '@/lib/scrollBlur'

const SCROLL_EASE = 'cubic-bezier(0.16, 1, 0.3, 1)'

export function useChapterPanelOpacity(chapterId: string) {
  const { phase, targetId, activeSlideId, reveals } = useChapterNav()

  const scrollReveal = reveals[chapterId] ?? 0
  const flowChapter = isFlowChapterId(chapterId)

  if (phase === 'out') {
    return {
      opacity: 0,
      isActive: false,
      style: {
        opacity: 0,
        filter: blurOutFromReveal(0, SCROLL_BLUR_PX).filter,
        zIndex: 0,
        pointerEvents: 'none',
        /* Instant hide before programmatic scroll — avoids old chapter lingering. */
        transition: 'none',
      } as const,
    }
  }

  if (phase === 'in') {
    const entering = chapterId === targetId
    const { opacity, filter } = blurOutFromReveal(entering ? 1 : 0, SCROLL_BLUR_PX)
    const flowEntering =
      entering && isFixedSlideshowFlowChapter(chapterId)
    return {
      opacity,
      isActive: entering,
      style: {
        opacity,
        filter: flowEntering ? 'none' : filter,
        zIndex: flowEntering ? 110 : entering ? 2 : 0,
        pointerEvents: entering ? 'auto' : 'none',
        transition: `opacity ${CHAPTER_NAV_FADE_MS}ms ${SCROLL_EASE}, filter ${CHAPTER_NAV_FADE_MS}ms ${SCROLL_EASE}`,
      } as const,
    }
  }

  if (flowChapter) {
    // Fixed slideshow (Mobile / EIB / Web Apps on desktop): crossfade like Hardware.
    // Binary onScreen opacity stacks every adjacent slide at 1 — overview covers sensi.
    if (isFixedSlideshowFlowChapter(chapterId)) {
      let reveal = scrollReveal
      let isActive = scrollReveal > 0.5
      if (activeSlideId === chapterId) {
        reveal = Math.max(reveal, 1)
        isActive = true
      }
      return {
        opacity: reveal,
        isActive,
        style: {
          opacity: reveal,
          filter: 'none',
          zIndex: reveal > 0.08 ? Math.round(10 + reveal * 90) : 0,
          pointerEvents: isActive ? 'auto' : 'none',
          transition: 'none',
        } as const,
      }
    }

    const onScreen = scrollReveal > 0
    return {
      opacity: onScreen ? 1 : 0,
      isActive: onScreen,
      style: {
        opacity: onScreen ? 1 : 0,
        filter: 'none',
        zIndex: onScreen ? 1 : 0,
        pointerEvents: onScreen ? 'auto' : 'none',
        transition: 'none',
      } as const,
    }
  }

  let reveal = scrollReveal
  let isActive = scrollReveal > 0.5

  if (activeSlideId === chapterId) {
    isActive = scrollReveal > 0.25
  }

  return {
    opacity: reveal,
    isActive,
    style: {
      opacity: reveal,
      filter: 'none',
      zIndex: reveal > 0.08 ? Math.round(1 + reveal) : 0,
      pointerEvents: isActive ? 'auto' : 'none',
      transition: 'none',
    } as const,
  }
}
