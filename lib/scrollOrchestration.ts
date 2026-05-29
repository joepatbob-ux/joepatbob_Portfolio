import {
  CHAPTER_SLOT_SELECTOR,
  computeChapterRevealMap,
  pickActiveSlideId,
  publishActiveSlideId,
  publishChapterRevealMap,
} from '@/lib/chapterSlideshow'
import { FLOW_CHAPTER_SLOT_SELECTOR } from '@/lib/chapterFlow'
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

function computeFlowChapterRevealMap(): Record<string, number> {
  const map: Record<string, number> = {}
  const vh = window.innerHeight

  document.querySelectorAll<HTMLElement>(FLOW_CHAPTER_SLOT_SELECTOR).forEach((el) => {
    const id = el.dataset.chapterId
    if (!id) return
    // Viewport snap slides (Mobile / EIB / Web Apps) use computeChapterRevealMap crossfade.
    if (el.classList.contains('hardware-slideshow')) return
    const rect = el.getBoundingClientRect()
    const onScreen = rect.bottom > 0 && rect.top < vh
    map[id] = onScreen ? 1 : 0
  })

  return map
}

/** Phone: everything in-flow; no viewport snap crossfade. */
function computeMobileRevealMap(): Record<string, number> {
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
    const revealMap = computeMobileRevealMap()
    return {
      revealMap,
      activeSlideId: pickActiveSlideId(revealMap),
      inHero: false,
    }
  }

  const revealMap = {
    ...computeChapterRevealMap(),
    ...computeFlowChapterRevealMap(),
  }
  return {
    revealMap,
    activeSlideId: pickActiveSlideId(revealMap),
    inHero: false,
  }
}

export function publishSlideScrollState(state: SlideScrollState): void {
  publishChapterRevealMap(state.revealMap)
  publishActiveSlideId(state.activeSlideId)
}
