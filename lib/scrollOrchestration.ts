import {
  computeChapterRevealMap,
  pickActiveSlideId,
  publishActiveSlideId,
  publishChapterRevealMap,
} from '@/lib/chapterSlideshow'
import { isInHeroScrollZone } from '@/lib/heroScroll'

export type SlideNavPhase = 'idle' | 'out' | 'in'

export type SlideScrollState = {
  revealMap: Record<string, number>
  activeSlideId: string | null
  inHero: boolean
}

/** Single scroll measurement for panels, nav, and stickers. */
export function measureSlideScrollState(phase: SlideNavPhase): SlideScrollState {
  if (phase === 'out') {
    return { revealMap: {}, activeSlideId: null, inHero: false }
  }

  if (isInHeroScrollZone()) {
    return { revealMap: {}, activeSlideId: null, inHero: true }
  }

  return {
    revealMap: computeChapterRevealMap(),
    activeSlideId: pickActiveSlideId(),
    inHero: false,
  }
}

export function publishSlideScrollState(state: SlideScrollState): void {
  publishChapterRevealMap(state.revealMap)
  publishActiveSlideId(state.activeSlideId)
}
