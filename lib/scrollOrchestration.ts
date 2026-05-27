import {
  CHAPTER_SLOT_SELECTOR,
  computeChapterRevealMap,
  pickActiveSlideId,
  publishActiveSlideId,
  publishChapterRevealMap,
} from '@/lib/chapterSlideshow'
import { isInHeroScrollZone } from '@/lib/heroScroll'
import { LAYOUT_MQ } from '@/lib/layout/breakpoints'

export type SlideNavPhase = 'idle' | 'out' | 'in'

export type SlideScrollState = {
  revealMap: Record<string, number>
  activeSlideId: string | null
  inHero: boolean
}

function isMobileViewport(): boolean {
  if (typeof window === 'undefined') return false
  return window.matchMedia(LAYOUT_MQ.mobile).matches
}

import { FLOW_CHAPTER_SLOT_SELECTOR } from '@/lib/chapterFlow'

const FLOW_CHAPTER_SELECTOR = FLOW_CHAPTER_SLOT_SELECTOR

/** In-flow chapters (Mobile / Web Apps / EIB) use visibility, not snap crossfade. */
function mergeFlowChapterReveals(
  base: Record<string, number>,
): Record<string, number> {
  if (typeof document === 'undefined') return base

  const merged = { ...base }
  const vh = window.innerHeight

  document.querySelectorAll<HTMLElement>(FLOW_CHAPTER_SELECTOR).forEach((el) => {
    const id = el.dataset.chapterId
    if (!id) return
    const rect = el.getBoundingClientRect()
    const onScreen = rect.bottom > 0 && rect.top < vh
    merged[id] = onScreen ? 1 : 0
  })

  return merged
}

/** Mobile: in-flow chapters — no crossfade; any on-screen slide stays fully revealed. */
function computeMobileFlowRevealMap(): Record<string, number> {
  const map: Record<string, number> = {}
  const vh = window.innerHeight

  document.querySelectorAll<HTMLElement>(CHAPTER_SLOT_SELECTOR).forEach((el) => {
    const id = el.dataset.chapterId
    if (!id) return
    const rect = el.getBoundingClientRect()
    const onScreen = rect.bottom > 0 && rect.top < vh
    map[id] = onScreen ? 1 : 0
  })

  return map
}

/** Single scroll measurement for panels, nav, and stickers. */
export function measureSlideScrollState(phase: SlideNavPhase): SlideScrollState {
  if (phase === 'out') {
    return { revealMap: {}, activeSlideId: null, inHero: false }
  }

  if (isInHeroScrollZone()) {
    return { revealMap: {}, activeSlideId: null, inHero: true }
  }

  if (isMobileViewport()) {
    return {
      revealMap: computeMobileFlowRevealMap(),
      activeSlideId: pickActiveSlideId(),
      inHero: false,
    }
  }

  return {
    revealMap: mergeFlowChapterReveals(computeChapterRevealMap()),
    activeSlideId: pickActiveSlideId(),
    inHero: false,
  }
}

export function publishSlideScrollState(state: SlideScrollState): void {
  publishChapterRevealMap(state.revealMap)
  publishActiveSlideId(state.activeSlideId)
}
