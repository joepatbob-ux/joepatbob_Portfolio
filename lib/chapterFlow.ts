/** Viewport-height snap slides (Hardware, etc.) — not in-flow case studies. */
export const VIEWPORT_SNAP_SLOT_SELECTOR =
  '.portfolio-chapter-slot--fill.hardware-slideshow[data-chapter-id]'

/** Flow case studies (Mobile, EIB, Web Apps) — all use .flow-chapter-slide on the slot. */
export const FLOW_CHAPTER_SLOT_SELECTOR =
  '.portfolio-chapter-slot.flow-chapter-slide[data-chapter-id]'

const FLOW_CHAPTER_PREFIXES = [
  'mobile-',
  'everything-else-',
  'web-apps-',
] as const

/** Flow case-study chapter ids (avoid DOM query — slot may not exist on first paint). */
export function isFlowChapterId(chapterId: string): boolean {
  return FLOW_CHAPTER_PREFIXES.some((prefix) => chapterId.startsWith(prefix))
}

export function isFlowChapterSlot(el: Element | null): boolean {
  return el?.classList.contains('flow-chapter-slide') ?? false
}

/** Flow chapters use the fixed hardware-slideshow shell on tablet/desktop. */
export function isFixedSlideshowFlowChapter(chapterId: string): boolean {
  return isFlowChapterId(chapterId)
}
