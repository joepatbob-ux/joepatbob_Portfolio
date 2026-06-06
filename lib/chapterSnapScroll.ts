import {
  resetAllChapterCopyScrollers,
  resetChapterCopyScrollersAfterSnap,
} from '@/lib/chapterCopyScrollReset'

const CHAPTER_SLOT_SELECTOR = '.portfolio-chapter-slot[data-chapter-id]'

/** Document Y for a chapter snap slot — never use scrollIntoView (nested copy traps jump). */
export function chapterSlotScrollTop(slot: HTMLElement): number {
  return slot.offsetTop
}

export function queryChapterSlot(chapterId: string): HTMLElement | null {
  return document.querySelector<HTMLElement>(
    `${CHAPTER_SLOT_SELECTOR}[data-chapter-id="${CSS.escape(chapterId)}"]`,
  )
}

/** Scroll the document to a chapter slot without touching nested copy scrollers. */
export function scrollDocumentToChapterSlot(slot: HTMLElement): void {
  resetAllChapterCopyScrollers()
  window.scrollTo({
    top: chapterSlotScrollTop(slot),
    left: 0,
    behavior: 'auto',
  })
  resetChapterCopyScrollersAfterSnap(slot)
}

export function scrollDocumentToChapterId(chapterId: string): boolean {
  const slot = queryChapterSlot(chapterId)
  if (!slot) return false
  scrollDocumentToChapterSlot(slot)
  return true
}

/** Chapter slot whose document offset matches the current scroll position. */
export function chapterSlotAtScrollY(
  scrollY: number = window.scrollY,
): HTMLElement | null {
  const slots = Array.from(
    document.querySelectorAll<HTMLElement>(CHAPTER_SLOT_SELECTOR),
  ).sort((a, b) => a.offsetTop - b.offsetTop)

  if (!slots.length) return null

  const anchor = scrollY + window.innerHeight * 0.35
  let match = slots[0]
  for (const slot of slots) {
    if (slot.offsetTop <= anchor) match = slot
  }
  return match
}
