import { CHAPTER_NAV_FADE_IN_MS, useChapterNav } from '@/components/ChapterNavProvider'
import { isDeckActive } from '@/lib/deck/deckMode'
import { isFixedSlideshowFlowChapter, isFlowChapterId } from '@/lib/chapterFlow'
import { isContinuousChapters } from '@/lib/scroll/continuousChapters'
import {
  chapterIsAccessible,
  chapterIsContinuousActive,
  chapterIsInteractive,
} from '@/lib/scroll/chapterVisibility'
import { useChapterReveal, usePublishedActiveSlideId } from '@/lib/hooks/useChapterReveal'
import { useLayoutMobile } from '@/lib/hooks/useLayoutMobile'
import { useLayoutTopBarNav } from '@/lib/hooks/useLayoutTopBarNav'
import {
  MOBILE_PANEL_Z_ENTERING,
  panelZFromScrollReveal,
} from '@/lib/layout/stacking'
import {
  SCROLL_BLUR_PX,
  blurOutFromReveal,
} from '@/lib/scroll/scrollBlur'

const SCROLL_EASE = 'cubic-bezier(0.16, 1, 0.3, 1)'

export function useChapterPanelOpacity(chapterId: string) {
  const { phase, targetId, navFadeInArmed, activeSlideId, reveals } = useChapterNav()
  const layoutMobile = useLayoutMobile()
  const topBarNav = useLayoutTopBarNav()
  const publishedReveal = useChapterReveal(chapterId)
  const publishedActiveSlideId = usePublishedActiveSlideId()

  const scrollReveal =
    phase === 'idle' ? publishedReveal : (reveals[chapterId] ?? 0)
  const resolvedActiveSlideId =
    phase === 'idle' && topBarNav ? publishedActiveSlideId : activeSlideId
  const flowChapter = isFlowChapterId(chapterId)
  const fixedSlideshowStacking =
    isFixedSlideshowFlowChapter(chapterId) && !layoutMobile && !isContinuousChapters()

  // Deck: opacity is driven purely by the active chapter (no scroll reveal); the
  // active panel cross-fades in, the rest out. `isActive` also gates the R3F
  // frameloop, so only the active chapter's canvas renders.
  if (isDeckActive()) {
    const active = chapterId === activeSlideId
    return {
      opacity: active ? 1 : 0,
      isActive: active,
      ariaHidden: !active,
      style: {
        opacity: active ? 1 : 0,
        filter: 'none',
        zIndex: active ? 2 : 1,
        pointerEvents: active ? 'auto' : 'none',
        visibility: 'visible',
        transition: `opacity ${CHAPTER_NAV_FADE_IN_MS}ms ${SCROLL_EASE}`,
      } as const,
    }
  }

  if (phase === 'idle' && topBarNav) {
    const visibility = scrollReveal
    const isActive = chapterIsInteractive(
      visibility,
      resolvedActiveSlideId,
      chapterId,
    )
    return {
      opacity: 1,
      isActive,
      ariaHidden: !chapterIsAccessible(visibility),
      style: undefined,
    }
  }

  if (phase === 'idle' && isContinuousChapters()) {
    const reveal = scrollReveal
    const isActive = chapterIsContinuousActive(
      reveal,
      publishedActiveSlideId,
      chapterId,
    )

    return {
      opacity: reveal,
      isActive,
      ariaHidden: !chapterIsAccessible(reveal),
      style: {
        zIndex: panelZFromScrollReveal(reveal, false),
        pointerEvents: isActive ? 'auto' : 'none',
        visibility: 'visible',
        transition: 'none',
      } as const,
    }
  }

  if (phase === 'idle') {
    const isActive = scrollReveal > 0.25

    if (fixedSlideshowStacking) {
      const active = scrollReveal > 0.5
      return {
        opacity: scrollReveal,
        isActive: active,
        ariaHidden: !active,
        style: {
          opacity: scrollReveal,
          filter: 'none',
          zIndex: panelZFromScrollReveal(scrollReveal, false),
          pointerEvents: active ? 'auto' : 'none',
          visibility: scrollReveal <= 0.02 ? 'hidden' : 'visible',
          transition: 'none',
        } as const,
      }
    }

    return {
      opacity: scrollReveal,
      isActive,
      ariaHidden: !isActive,
      style: {
        opacity: scrollReveal,
        filter: 'none',
        zIndex: panelZFromScrollReveal(scrollReveal, layoutMobile),
        pointerEvents: isActive ? 'auto' : 'none',
        visibility: scrollReveal <= 0.02 ? 'hidden' : 'visible',
        transition: 'none',
      } as const,
    }
  }

  // Nav transition phases — React owns panel styles (legacy / fixed slideshow).
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
        visibility: 'hidden',
        transition: 'none',
      } as const,
    }
  }

  if (phase === 'in') {
    const entering = chapterId === targetId
    const fadeOpacity = entering && navFadeInArmed ? 1 : 0
    const { filter } = blurOutFromReveal(fadeOpacity, SCROLL_BLUR_PX)
    const flowEntering = entering && fixedSlideshowStacking
    return {
      opacity: fadeOpacity,
      isActive: entering && navFadeInArmed,
      ariaHidden: !entering,
      style: {
        opacity: fadeOpacity,
        filter: flowEntering ? 'none' : filter,
        zIndex: flowEntering
          ? 100
          : entering
            ? layoutMobile
              ? MOBILE_PANEL_Z_ENTERING
              : 2
            : 0,
        pointerEvents: entering && navFadeInArmed ? 'auto' : 'none',
        visibility: entering ? 'visible' : 'hidden',
        transition:
          entering && navFadeInArmed
            ? `opacity ${CHAPTER_NAV_FADE_IN_MS}ms ${SCROLL_EASE}, filter ${CHAPTER_NAV_FADE_IN_MS}ms ${SCROLL_EASE}`
            : 'none',
      } as const,
    }
  }

  if (flowChapter) {
    // Fixed slideshow (Mobile / EIB / Web Apps on desktop): crossfade like Hardware.
    // Binary onScreen opacity stacks every adjacent slide at 1 — overview covers sensi.
    if (fixedSlideshowStacking) {
      const reveal = scrollReveal
      const isActive = scrollReveal > 0.5
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

  const reveal = scrollReveal
  const isActive = scrollReveal > 0.5

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
