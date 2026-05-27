/** In-flow case study slots (Mobile / Web Apps / EIB) — not snap slideshow slides. */
export const FLOW_CHAPTER_SLOT_SELECTOR =
  '.mobile-chapter-slot.portfolio-chapter-slot[data-chapter-id]'

export function isFlowChapterId(chapterId: string): boolean {
  if (typeof document === 'undefined') return false
  return !!document.querySelector(
    `${FLOW_CHAPTER_SLOT_SELECTOR}[data-chapter-id="${CSS.escape(chapterId)}"]`,
  )
}

export function isFlowChapterSlot(el: Element | null): boolean {
  return el?.classList.contains('mobile-chapter-slot') ?? false
}
