import {
  computeChapterRevealMap,
  measureTopBarInFlowScroll,
  pickActiveSlideId,
  publishActiveSlideId,
  publishChapterRevealMap,
} from '@/lib/chapterSlideshow'
import { FLOW_CHAPTER_SLOT_SELECTOR } from '@/lib/chapterFlow'
import { isTopBarInHeroScrollZone, shouldSuppressChapterReveal } from '@/lib/heroScroll'
import { isTopBarNavViewport } from '@/lib/layout/isTopBarNavViewport'

export type SlideNavPhase = 'idle' | 'out' | 'in'

export type SlideScrollState = {
  revealMap: Record<string, number>
  activeSlideId: string | null
  inHero: boolean
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

/** Single scroll measurement for panels, nav, and stickers. */
export function measureSlideScrollState(
  phase: SlideNavPhase,
  /** During sidebar goto — keep highlight on destination, not scroll midpoint. */
  lockedSlideId: string | null = null,
): SlideScrollState {
  if (lockedSlideId) {
    if (phase === 'out') {
      return { revealMap: {}, activeSlideId: lockedSlideId, inHero: false }
    }
    return {
      revealMap: { [lockedSlideId]: 1 },
      activeSlideId: lockedSlideId,
      inHero: false,
    }
  }

  if (phase === 'out') {
    return { revealMap: {}, activeSlideId: null, inHero: false }
  }

  if (isTopBarNavViewport()) {
    const inHero = isTopBarInHeroScrollZone()
    if (inHero) {
      return { revealMap: {}, activeSlideId: null, inHero: true }
    }
    const { revealMap, activeSlideId } = measureTopBarInFlowScroll()
    return { revealMap, activeSlideId, inHero: false }
  }

  if (shouldSuppressChapterReveal()) {
    return { revealMap: {}, activeSlideId: null, inHero: true }
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
