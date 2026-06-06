'use client'

import { CHAPTER_NAV_FADE_MS, useChapterNav } from '@/components/ChapterNavProvider'
import { isFixedSlideshowFlowChapter, isFlowChapterId } from '@/lib/chapterFlow'
import {
  chapterIsAccessible,
  chapterIsInteractive,
} from '@/lib/chapterVisibility'
import { chapterRevealForId } from '@/lib/chapterSlideshow'
import { useLayoutMobile } from '@/lib/hooks/useLayoutMobile'
import { useLayoutTopBarNav } from '@/lib/hooks/useLayoutTopBarNav'
import {
  MOBILE_PANEL_Z_ENTERING,
  panelZFromScrollReveal,
} from '@/lib/layout/stacking'
import { SCROLL_BLUR_PX, blurOutFromReveal } from '@/lib/scrollBlur'

const SCROLL_EASE = 'cubic-bezier(0.16, 1, 0.3, 1)'

export function useChapterPanelOpacity(chapterId: string) {
  const { phase, targetId, activeSlideId, reveals } = useChapterNav()
  const layoutMobile = useLayoutMobile()
  const topBarNav = useLayoutTopBarNav()

  const scrollReveal =
    phase === 'idle'
      ? topBarNav
        ? (reveals[chapterId] ?? 0)
        : chapterRevealForId(chapterId)
      : (reveals[chapterId] ?? 0)
  const flowChapter = isFlowChapterId(chapterId)
  const fixedSlideshowStacking =
    isFixedSlideshowFlowChapter(chapterId) && !layoutMobile

  if (phase === 'idle' && topBarNav) {
    const visibility = scrollReveal
    const isActive = chapterIsInteractive(
      visibility,
      activeSlideId,
      chapterId,
    )
    return {
      opacity: 1,
      isActive,
      ariaHidden: !chapterIsAccessible(visibility),
      style: undefined,
    }
  }

  if (phase === 'idle') {
    const isActive =
      activeSlideId === chapterId || scrollReveal > 0.25
    return {
      opacity: scrollReveal,
      isActive,
      ariaHidden: !isActive,
      style: undefined,
    }
  }

  // Nav transition phases — React owns panel styles.
  if (phase === 'out') {
    return {
      opacity: 0,
      isActive: false,
      ariaHidden: true,
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
    const flowEntering = entering && fixedSlideshowStacking
    return {
      opacity,
      isActive: entering,
      ariaHidden: !entering,
      style: {
        opacity,
        filter: flowEntering ? 'none' : filter,
        zIndex: flowEntering
          ? 100
          : entering
            ? layoutMobile
              ? MOBILE_PANEL_Z_ENTERING
              : 2
            : 0,
        pointerEvents: entering ? 'auto' : 'none',
        transition: `opacity ${CHAPTER_NAV_FADE_MS}ms ${SCROLL_EASE}, filter ${CHAPTER_NAV_FADE_MS}ms ${SCROLL_EASE}`,
      } as const,
    }
  }

  if (flowChapter) {
    // Fixed slideshow (Mobile / EIB / Web Apps on desktop): crossfade like Hardware.
    // Binary onScreen opacity stacks every adjacent slide at 1 — overview covers sensi.
    if (fixedSlideshowStacking) {
      let reveal = scrollReveal
      let isActive = scrollReveal > 0.5
      if (activeSlideId === chapterId) {
        reveal = Math.max(reveal, 1)
        isActive = true
      }
      return {
        opacity: reveal,
        isActive,
        ariaHidden: !isActive,
        style: {
          opacity: reveal,
          filter: 'none',
          zIndex: panelZFromScrollReveal(reveal, false),
          pointerEvents: isActive ? 'auto' : 'none',
          transition: 'none',
        } as const,
      }
    }

    const onScreen = scrollReveal > 0
    return {
      opacity: onScreen ? 1 : 0,
      isActive: onScreen,
      ariaHidden: !onScreen,
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
    ariaHidden: !isActive,
    style: {
      opacity: reveal,
      filter: 'none',
      zIndex: panelZFromScrollReveal(reveal, layoutMobile),
      pointerEvents: isActive ? 'auto' : 'none',
      transition: 'none',
    } as const,
  }
}
