import { VIEWPORT_SNAP_SLOT_SELECTOR } from '@/lib/chapterFlow'
import { isLayoutMobileViewport } from '@/lib/layout/isLayoutMobileViewport'

/** Real snap slides only — excludes placed stickers (they use data-sticker-chapter-id). */
export const CHAPTER_SLOT_SELECTOR = '.portfolio-chapter-slot[data-chapter-id]'

let publishedRevealMap: Record<string, number> = {}
let publishedActiveSlideId: string | null = null

function chapterSlots(): HTMLElement[] {
  return Array.from(
    document.querySelectorAll<HTMLElement>(CHAPTER_SLOT_SELECTOR),
  )
}

/** Latest scroll reveal map (one compute per frame from scroll orchestration). */
export function publishChapterRevealMap(map: Record<string, number>): void {
  publishedRevealMap = map
}

/** Viewport-centered slide index — used by stickers when reveal map is empty or lagging. */
export function publishActiveSlideId(id: string | null): void {
  publishedActiveSlideId = id
}

export function activeSlideIdPublished(): string | null {
  return publishedActiveSlideId
}

export function chapterRevealForId(chapterId: string): number {
  return publishedRevealMap[chapterId] ?? 0
}

/** Chapter slide whose document center is closest to this Y (page coordinates). */
export function nearestChapterIdForDocY(docY: number): string | null {
  let bestId: string | null = null
  let bestDist = Infinity

  chapterSlots().forEach((el) => {
    const id = el.dataset.chapterId
    if (!id) return
    const rect = el.getBoundingClientRect()
    const centerY = rect.top + window.scrollY + rect.height / 2
    const d = Math.abs(docY - centerY)
    if (d < bestDist) {
      bestDist = d
      bestId = id
    }
  })

  return bestId
}

/** Smooth 0→1 easing for scroll-driven panel reveal. */
export function easeChapterReveal(t: number): number {
  const x = Math.max(0, Math.min(1, t))
  return x * x * (3 - 2 * x)
}

/** Hold each slide at full opacity before crossfading to the next (0–1 scroll progress). */
const CROSSFADE_HOLD = 0.24

function crossfadeWeights(t: number): { outgoing: number; incoming: number } {
  const x = Math.max(0, Math.min(1, t))
  if (x <= CROSSFADE_HOLD) return { outgoing: 1, incoming: 0 }
  if (x >= 1 - CROSSFADE_HOLD) return { outgoing: 0, incoming: 1 }
  const local = (x - CROSSFADE_HOLD) / (1 - 2 * CROSSFADE_HOLD)
  const eased = easeChapterReveal(local)
  return { outgoing: 1 - eased, incoming: eased }
}

type SlideAnchor = { id: string; centerY: number }

function snapSlideAnchors(): SlideAnchor[] {
  return Array.from(
    document.querySelectorAll<HTMLElement>(VIEWPORT_SNAP_SLOT_SELECTOR),
  )
    .map((el) => {
      const id = el.dataset.chapterId
      if (!id) return null
      const rect = el.getBoundingClientRect()
      return {
        id,
        centerY: rect.top + window.scrollY + rect.height / 2,
      }
    })
    .filter((s): s is SlideAnchor => s !== null)
}

/**
 * Opacity per chapter from scroll position (panels stay fixed; only reveal changes).
 * At most two adjacent chapters blend during a scroll transition.
 */
export function computeChapterRevealMap(): Record<string, number> {
  const slots = snapSlideAnchors()
  if (!slots.length) return {}

  const map: Record<string, number> = {}
  slots.forEach((s) => {
    map[s.id] = 0
  })

  const centerY = window.scrollY + window.innerHeight / 2

  if (centerY <= slots[0].centerY) {
    map[slots[0].id] = 1
    return map
  }

  const last = slots[slots.length - 1]
  if (centerY >= last.centerY) {
    map[last.id] = 1
    return map
  }

  for (let i = 0; i < slots.length - 1; i++) {
    const a = slots[i]
    const b = slots[i + 1]
    if (centerY >= a.centerY && centerY <= b.centerY) {
      const span = b.centerY - a.centerY
      const t = span > 0 ? (centerY - a.centerY) / span : 0
      const { outgoing, incoming } = crossfadeWeights(t)
      map[a.id] = outgoing
      map[b.id] = incoming
      return map
    }
  }

  let best = slots[0]
  let bestDist = Infinity
  for (const s of slots) {
    const d = Math.abs(centerY - s.centerY)
    if (d < bestDist) {
      bestDist = d
      best = s
    }
  }
  map[best.id] = 1
  return map
}

function visibleHeightInViewport(rect: DOMRect, vh: number): number {
  return Math.max(0, Math.min(rect.bottom, vh) - Math.max(rect.top, 0))
}

/** Mobile: chapter with the largest visible area (tall in-flow slides). */
function pickActiveSlideIdByVisibility(): string | null {
  const slots = chapterSlots()
  if (!slots.length) return null

  const vh = window.innerHeight
  let bestId: string | null = null
  let bestVisible = 0

  slots.forEach((el) => {
    const id = el.dataset.chapterId
    if (!id) return
    const visible = visibleHeightInViewport(el.getBoundingClientRect(), vh)
    if (visible > bestVisible) {
      bestVisible = visible
      bestId = id
    }
  })

  return bestId
}

/** Top-bar nav: stick to current chapter until challenger leads by ~12% viewport. */
export function pickActiveSlideIdForTopBarNav(): string | null {
  const vh = window.innerHeight
  const minLeadPx = Math.max(72, Math.round(vh * 0.12))
  const slots = chapterSlots()

  let bestId: string | null = null
  let bestVisible = 0
  const visibleById = new Map<string, number>()

  slots.forEach((el) => {
    const id = el.dataset.chapterId
    if (!id) return
    const visible = visibleHeightInViewport(el.getBoundingClientRect(), vh)
    visibleById.set(id, visible)
    if (visible > bestVisible) {
      bestVisible = visible
      bestId = id
    }
  })

  const current = publishedActiveSlideId
  if (current && bestId && current !== bestId) {
    const currentVisible = visibleById.get(current) ?? 0
    if (bestVisible - currentVisible < minLeadPx) {
      return current
    }
  }

  return bestId
}

/**
 * Active chapter from scroll reveal weights (matches panel crossfade).
 * Hysteresis stops sidebar highlight flipping between adjacent snap slides.
 */
export function pickActiveSlideIdFromRevealMap(
  map: Record<string, number>,
  hysteresis = 0.12,
): string | null {
  let bestId: string | null = null
  let bestReveal = 0

  for (const [id, reveal] of Object.entries(map)) {
    if (reveal > bestReveal) {
      bestReveal = reveal
      bestId = id
    }
  }

  const current = publishedActiveSlideId
  if (current && bestId && current !== bestId) {
    const currentReveal = map[current] ?? 0
    if (bestReveal - currentReveal < hysteresis) {
      return current
    }
  }

  if (!bestId || bestReveal < 0.02) {
    return pickActiveSlideIdByVisibility()
  }

  return bestId
}

/** Chapter with the largest visible area (snap slides and in-flow sections). */
export function pickActiveSlideId(
  revealMap?: Record<string, number>,
): string | null {
  if (revealMap && Object.keys(revealMap).length > 0) {
    return pickActiveSlideIdFromRevealMap(
      revealMap,
      isLayoutMobileViewport() ? 0 : 0.12,
    )
  }
  return pickActiveSlideIdByVisibility()
}
