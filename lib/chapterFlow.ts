/** Viewport-height snap slides (Hardware, etc.) — not in-flow case studies. */
export const VIEWPORT_SNAP_SLOT_SELECTOR =
  '.portfolio-chapter-slot--fill.hardware-slideshow[data-chapter-id]'

/** Flow case studies (Mobile, EIB, Web Apps) — all use .flow-chapter-slide on the slot. */
export const FLOW_CHAPTER_SLOT_SELECTOR =
  '.portfolio-chapter-slot.flow-chapter-slide[data-chapter-id]'

export function isFlowChapterId(chapterId: string): boolean {
  if (typeof document === 'undefined') return false
  return !!document.querySelector(
    `${FLOW_CHAPTER_SLOT_SELECTOR}[data-chapter-id="${CSS.escape(chapterId)}"]`,
  )
}

export function isFlowChapterSlot(el: Element | null): boolean {
  return el?.classList.contains('flow-chapter-slide') ?? false
}
