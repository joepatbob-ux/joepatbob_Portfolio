import { chapterSlotScrollCenter } from '@/lib/chapterSnapScroll'
import { VIEWPORT_SNAP_SLOT_SELECTOR } from '@/lib/chapterFlow'
import { heroChapterHandoffProgress } from '@/lib/heroScroll'
import { isLayoutMobileViewport } from '@/lib/layout/isLayoutMobileViewport'
import { getLayoutViewportHeight } from '@/lib/mobileViewport'

/** Real snap slides only — excludes placed stickers (they use data-sticker-chapter-id). */
export const CHAPTER_SLOT_SELECTOR = '.portfolio-chapter-slot[data-chapter-id]'

let publishedRevealMap: Record<string, number> = {}
let publishedActiveSlideId: string | null = null

type ChapterScrollListener = () => void
const chapterScrollListeners = new Set<ChapterScrollListener>()

/** Subscribe to scroll-published reveal / active-slide updates (useSyncExternalStore). */
export function subscribeChapterScrollState(listener: ChapterScrollListener): () => void {
  chapterScrollListeners.add(listener)
  return () => {
    chapterScrollListeners.delete(listener)
  }
}

function notifyChapterScrollState(): void {
  chapterScrollListeners.forEach((listener) => {
    listener()
  })
}

function chapterSlots(): HTMLElement[] {
  return Array.from(
    document.querySelectorAll<HTMLElement>(CHAPTER_SLOT_SELECTOR),
  )
}

/** Latest scroll reveal map (one compute per frame from scroll orchestration). */
export function publishChapterRevealMap(map: Record<string, number>): void {
  publishedRevealMap = map
  notifyChapterScrollState()
}

/** Viewport-centered slide index — used by stickers when reveal map is empty or lagging. */
export function publishActiveSlideId(id: string | null): void {
  publishedActiveSlideId = id
  notifyChapterScrollState()
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


function computeRevealMapFromAnchors(slots: SlideAnchor[]): Record<string, number> {
  if (!slots.length) return {}

  const map: Record<string, number> = {}
  slots.forEach((s) => {
    map[s.id] = 0
  })

  const scrollY = window.scrollY
  const viewportH = window.innerHeight
  const centerY = scrollY + viewportH / 2

  if (centerY <= slots[0].centerY) {
    map[slots[0].id] = heroChapterHandoffProgress(
      scrollY,
      viewportH,
      slots[0].centerY,
    )
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

type SlideAnchor = { id: string; centerY: number }

function snapSlideCenterY(el: HTMLElement): number {
  return chapterSlotScrollCenter(el)
}

function snapSlideAnchors(): SlideAnchor[] {
  return Array.from(
    document.querySelectorAll<HTMLElement>(VIEWPORT_SNAP_SLOT_SELECTOR),
  )
    .map((el) => {
      const id = el.dataset.chapterId
      if (!id) return null
      return {
        id,
        centerY: snapSlideCenterY(el),
      }
    })
    .filter((s): s is SlideAnchor => s !== null)
}

/**
 * Opacity per chapter from scroll position (panels stay fixed; only reveal changes).
 * At most two adjacent chapters blend during a scroll transition.
 */
export function computeChapterRevealMap(): Record<string, number> {
  return computeRevealMapFromAnchors(snapSlideAnchors())
}

/** Fade band as copy enters from the bottom of the viewport. */
const COPY_ENTER_FADE_VH = 0.16
/** Fade out as copy tail leaves — fraction of viewport height. */
const COPY_EXIT_BOTTOM_VH = 0.48
/** Late assist when copy top clears the upper edge (keeps stage from lingering). */
const COPY_EXIT_TOP_VH = 0.1
const COPY_EXIT_TOP_DEPTH_VH = 0.2
/** Premount heavy stages when copy is this far below the fold (vh). */
const COPY_PREMOUNT_LEAD_VH = 0.22

function continuousRevealTarget(el: HTMLElement): HTMLElement {
  return (
    el.querySelector<HTMLElement>('.chapter-slide__copy') ??
    el.querySelector<HTMLElement>('.portfolio-chapter-panel') ??
    el
  )
}

/**
 * Reveal 0→1 as copy enters the viewport; 1→0 as copy leaves.
 * Premounts at low weight while copy is still below the fold.
 */
function revealFromCopyInViewport(rect: DOMRect, vh: number): number {
  if (vh <= 0) return 0

  const top = rect.top
  const bottom = rect.bottom
  const fadeInPx = Math.max(80, vh * COPY_ENTER_FADE_VH)
  const exitBottomPx = Math.max(120, vh * COPY_EXIT_BOTTOM_VH)
  const exitTopLine = vh * COPY_EXIT_TOP_VH
  const exitTopDepth = Math.max(80, vh * COPY_EXIT_TOP_DEPTH_VH)

  if (bottom <= 0) return 0

  if (top >= vh) {
    const lead = vh * COPY_PREMOUNT_LEAD_VH
    if (top < vh + lead) {
      const t = 1 - (top - vh) / lead
      return easeChapterReveal(Math.max(0, Math.min(1, t))) * 0.1
    }
    return 0
  }

  let enter = 1
  if (top > vh - fadeInPx) {
    enter = Math.max(0, (vh - top) / fadeInPx)
  }

  // Primary exit: trailing copy leaving the viewport (slow, wide band).
  let exit = 1
  if (bottom < exitBottomPx) {
    exit = easeChapterReveal(Math.max(0, bottom / exitBottomPx))
  }

  // Assist only when copy is mostly gone — avoids an abrupt stage hang.
  if (top < exitTopLine && bottom < vh * 0.5) {
    const topExit = Math.max(0, (top + exitTopDepth) / (exitTopLine + exitTopDepth))
    exit = Math.min(exit, easeChapterReveal(topExit))
  }

  const raw = Math.max(0, Math.min(enter, exit))
  return easeChapterReveal(raw)
}

/**
 * Continuous in-flow chapters: panel fade follows copy in the viewport.
 * Adjacent chapters crossfade naturally when both copies are partially visible.
 */
export function computeContinuousRevealMap(): Record<string, number> {
  const slots = chapterSlots()
  if (!slots.length) return {}

  const map: Record<string, number> = {}
  const scrollY = window.scrollY
  const vh = window.innerHeight

  slots.forEach((el, index) => {
    const id = el.dataset.chapterId
    if (!id) return

    const target = continuousRevealTarget(el)
    const rect = target.getBoundingClientRect()
    let reveal = revealFromCopyInViewport(rect, vh)

    if (index === 0) {
      const heroReveal = heroChapterHandoffProgress(scrollY, vh, rect.top + scrollY)
      reveal = Math.max(reveal, heroReveal)
    }

    map[id] = reveal
  })

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

/** One layout pass for top-bar in-flow scroll (reveal weights + active chapter). */
export function measureTopBarInFlowScroll(): {
  revealMap: Record<string, number>
  activeSlideId: string | null
} {
  const vh = getLayoutViewportHeight() || window.innerHeight
  const revealMap: Record<string, number> = {}
  if (vh <= 0) {
    return { revealMap, activeSlideId: null }
  }

  const mobile = isLayoutMobileViewport()
  const leadRatio = mobile ? 0.05 : 0.08
  const minLeadPx = Math.max(mobile ? 40 : 56, Math.round(vh * leadRatio))

  let bestId: string | null = null
  let bestVisible = 0
  const visibleById = new Map<string, number>()

  chapterSlots().forEach((el) => {
    const id = el.dataset.chapterId
    if (!id) return
    const visible = visibleHeightInViewport(el.getBoundingClientRect(), vh)
    revealMap[id] = visible / vh
    visibleById.set(id, visible)
    if (visible > bestVisible) {
      bestVisible = visible
      bestId = id
    }
  })

  let activeSlideId: string | null = bestId
  const current = publishedActiveSlideId
  if (current && bestId && current !== bestId) {
    const currentVisible = visibleById.get(current) ?? 0
    if (bestVisible - currentVisible < minLeadPx) {
      activeSlideId = current
    }
  }

  return { revealMap, activeSlideId }
}

/** Top-bar nav: stick to current chapter until challenger leads by a viewport fraction. */
export function pickActiveSlideIdForTopBarNav(): string | null {
  return measureTopBarInFlowScroll().activeSlideId
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
    if (currentReveal < 0.02) {
      return bestId
    }
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
