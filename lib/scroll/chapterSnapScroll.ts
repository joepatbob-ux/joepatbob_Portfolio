import {
  resetAllChapterCopyScrollers,
  resetChapterCopyScrollersAfterSnap,
} from '@/lib/scroll/chapterCopyScrollReset'
import { isContinuousChapters } from '@/lib/scroll/continuousChapters'
import { isTopBarNavViewport } from '@/lib/layout/isTopBarNavViewport'

const CHAPTER_SLOT_SELECTOR = '.portfolio-chapter-slot[data-chapter-id]'

/** Document Y for an element's layout top (offsetParent-safe). */
export function elementDocumentTop(el: HTMLElement): number {
  return el.getBoundingClientRect().top + window.scrollY
}

/**
 * Document scroll Y that aligns a chapter snap slot to the viewport top.
 * Uses getBoundingClientRect (not offsetTop) and honors scroll-margin-top.
 *
 * Continuous mode: slots carry scroll buffers above and below the content
 * band, so top-aligning the slot lands with the content sitting low. Aim at
 * the band instead: center it in the viewport when it fits, or align its top
 * to the viewport top when the band is taller than the viewport.
 */
export function chapterSlotScrollTop(slot: HTMLElement): number {
  const viewportHeight = window.innerHeight
  // Desktop continuous mode only — the class is a mode flag present at every
  // viewport, but phone/tablet keep top-align + scroll-margin (the margin
  // accounts for the fixed mobile rail).
  if (isContinuousChapters() && !isTopBarNavViewport()) {
    const band =
      slot.querySelector<HTMLElement>('.chapter-slide__inner') ?? slot
    const rect = band.getBoundingClientRect()
    if (rect.height > 0) {
      const bandTop = rect.top + window.scrollY
      // Band-relative target — the slot's scroll-margin-top belongs to the
      // top-align semantics below and must not shift a centered landing.
      const top =
        rect.height <= viewportHeight
          ? bandTop - (viewportHeight - rect.height) / 2
          : bandTop
      return Math.max(0, Math.round(top))
    }
  }
  let top = elementDocumentTop(slot)
  const marginTop = parseFloat(getComputedStyle(slot).scrollMarginTop)
  if (Number.isFinite(marginTop) && marginTop > 0) {
    top -= marginTop
  }
  return Math.max(0, Math.round(top))
}

/** Document Y at the vertical center of a chapter slot (for crossfade math). */
export function chapterSlotScrollCenter(slot: HTMLElement): number {
  const rect = slot.getBoundingClientRect()
  const height = rect.height > 0 ? rect.height : slot.offsetHeight
  if (height > 0) {
    return elementDocumentTop(slot) + height / 2
  }
  const vh = window.innerHeight
  if (vh > 0) {
    return chapterSlotScrollTop(slot) + vh / 2
  }
  return elementDocumentTop(slot)
}

export function queryChapterSlot(chapterId: string): HTMLElement | null {
  return document.querySelector<HTMLElement>(
    `${CHAPTER_SLOT_SELECTOR}[data-chapter-id="${CSS.escape(chapterId)}"]`,
  )
}

/** Scroll the document to a chapter slot without touching nested copy scrollers. */
export function scrollDocumentToChapterSlot(slot: HTMLElement): void {
  resetAllChapterCopyScrollers()

  window.scrollTo({ top: chapterSlotScrollTop(slot), left: 0, behavior: 'auto' })
  resetChapterCopyScrollersAfterSnap(slot)
  // The jump changes which stages are pinned, which changes flow heights —
  // and scroll anchoring can tug the position again. Re-aim against live
  // geometry for a few frames until the landing converges instead of
  // re-applying a stale captured target.
  let attempts = 0
  const settle = () => {
    const target = chapterSlotScrollTop(slot)
    if (Math.abs(window.scrollY - target) <= 2) return
    window.scrollTo({ top: target, left: 0, behavior: 'auto' })
    attempts += 1
    if (attempts < 6) requestAnimationFrame(settle)
  }
  requestAnimationFrame(settle)
}

export function scrollDocumentToChapterId(chapterId: string): boolean {
  const slot = queryChapterSlot(chapterId)
  if (!slot) return false
  scrollDocumentToChapterSlot(slot)
  return true
}

function chapterSlotsByDocumentTop(): HTMLElement[] {
  return Array.from(
    document.querySelectorAll<HTMLElement>(CHAPTER_SLOT_SELECTOR),
  ).sort((a, b) => chapterSlotScrollTop(a) - chapterSlotScrollTop(b))
}

/** Chapter slot whose document offset matches the current scroll position. */
export function chapterSlotAtScrollY(
  scrollY: number = window.scrollY,
): HTMLElement | null {
  const slots = chapterSlotsByDocumentTop()
  if (!slots.length) return null

  const anchor = scrollY + window.innerHeight * 0.35
  let match = slots[0]
  for (const slot of slots) {
    if (chapterSlotScrollTop(slot) <= anchor) match = slot
  }
  return match
}
