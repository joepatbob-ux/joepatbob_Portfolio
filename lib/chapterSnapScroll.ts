import {
  resetAllChapterCopyScrollers,
  resetChapterCopyScrollersAfterSnap,
} from '@/lib/chapterCopyScrollReset'

const CHAPTER_SLOT_SELECTOR = '.portfolio-chapter-slot[data-chapter-id]'

/** Document Y for an element's layout top (offsetParent-safe). */
export function elementDocumentTop(el: HTMLElement): number {
  return el.getBoundingClientRect().top + window.scrollY
}

/**
 * Document scroll Y that aligns a chapter snap slot to the viewport top.
 * Uses getBoundingClientRect (not offsetTop) and honors scroll-margin-top.
 */
export function chapterSlotScrollTop(slot: HTMLElement): number {
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

  const apply = () => {
    window.scrollTo({
      top: chapterSlotScrollTop(slot),
      left: 0,
      behavior: 'auto',
    })
  }

  apply()
  resetChapterCopyScrollersAfterSnap(slot)
  requestAnimationFrame(apply)
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
