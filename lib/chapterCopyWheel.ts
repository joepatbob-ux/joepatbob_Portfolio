import { CHAPTER_SLOT_SELECTOR } from '@/lib/chapterSlideshow'
import {
  isFlowChapterSlot,
  VIEWPORT_SNAP_SLOT_SELECTOR,
} from '@/lib/chapterFlow'

let listening = false

const EDGE_EPSILON = 2

function wheelDelta(e: WheelEvent, clientHeight: number): number {
  let delta = e.deltaY
  if (e.deltaMode === WheelEvent.DOM_DELTA_LINE) {
    delta *= 16
  } else if (e.deltaMode === WheelEvent.DOM_DELTA_PAGE) {
    delta *= clientHeight
  }
  return delta
}

function isInContentColumn(e: WheelEvent): boolean {
  const sidebar = document.querySelector<HTMLElement>('.sidebar-shell--fixed')
  if (!sidebar) return true
  return e.clientX >= sidebar.getBoundingClientRect().right - 4
}

function pointInRect(x: number, y: number, rect: DOMRect): boolean {
  return x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom
}

function isPanelHidden(slot: HTMLElement): boolean {
  const panel = slot.querySelector<HTMLElement>('.portfolio-chapter-panel')
  return panel?.getAttribute('aria-hidden') === 'true'
}

/** Scroll container for a viewport snap slide (copy scroller or overview panel). */
function scrollTargetInSlot(slot: HTMLElement): HTMLElement | null {
  const scroller = slot.querySelector<HTMLElement>('.chapter-copy-scroller')
  if (scroller) return scroller

  if (slot.classList.contains('case-study-overview')) {
    return slot.querySelector<HTMLElement>('.portfolio-chapter-panel')
  }

  return null
}

function scrollerAtEdge(
  el: HTMLElement,
  direction: 'up' | 'down',
): boolean {
  const { scrollTop, scrollHeight, clientHeight } = el
  if (scrollHeight <= clientHeight + EDGE_EPSILON) return true

  if (direction === 'down') {
    return scrollTop + clientHeight >= scrollHeight - EDGE_EPSILON
  }
  return scrollTop <= EDGE_EPSILON
}

function applyWheelScroll(el: HTMLElement, e: WheelEvent): boolean {
  const { scrollTop, scrollHeight, clientHeight } = el
  if (scrollHeight <= clientHeight + EDGE_EPSILON) return false

  const delta = wheelDelta(e, clientHeight)
  const atTop = scrollTop <= EDGE_EPSILON
  const atBottom = scrollTop + clientHeight >= scrollHeight - EDGE_EPSILON

  if (delta > 0 && atBottom) return false
  if (delta < 0 && atTop) return false

  e.preventDefault()
  e.stopPropagation()
  el.scrollTop = Math.max(
    0,
    Math.min(scrollTop + delta, scrollHeight - clientHeight),
  )
  return true
}

function snapSlotUnderPointer(e: WheelEvent): HTMLElement | null {
  const x = e.clientX
  const y = e.clientY

  const slots = Array.from(
    document.querySelectorAll<HTMLElement>(VIEWPORT_SNAP_SLOT_SELECTOR),
  )

  for (let i = slots.length - 1; i >= 0; i--) {
    const slot = slots[i]
    if (isPanelHidden(slot)) continue
    if (!pointInRect(x, y, slot.getBoundingClientRect())) continue
    return slot
  }

  return null
}

function scrollTargetUnderPointer(
  e: WheelEvent,
  slot: HTMLElement,
): HTMLElement | null {
  const target = scrollTargetInSlot(slot)
  if (!target) return null

  const x = e.clientX
  const y = e.clientY
  const targetRect = target.getBoundingClientRect()
  if (pointInRect(x, y, targetRect)) {
    return target
  }

  const copyCol = slot.querySelector<HTMLElement>('.chapter-slide__copy')
  if (copyCol && pointInRect(x, y, copyCol.getBoundingClientRect())) {
    return target
  }

  if (slot.classList.contains('case-study-overview')) {
    const panel = slot.querySelector<HTMLElement>('.portfolio-chapter-panel')
    if (panel && pointInRect(x, y, panel.getBoundingClientRect())) {
      return target
    }
  }

  return null
}

/**
 * Viewport snap slides only: let the browser scroll long copy; at top/bottom,
 * pass wheel to the document so scroll-snap can reach the next chapter.
 */
function handoffWheelAtCopyEdge(el: HTMLElement, e: WheelEvent): boolean {
  const delta = wheelDelta(e, el.clientHeight)
  const exitDown = delta > 0 && scrollerAtEdge(el, 'down')
  const exitUp = delta < 0 && scrollerAtEdge(el, 'up')
  if (!exitDown && !exitUp) return false

  e.preventDefault()
  e.stopPropagation()
  const root = document.scrollingElement ?? document.documentElement
  root.scrollTop += delta
  return true
}

function onWheelCapture(e: WheelEvent) {
  if (!isInContentColumn(e)) return

  const slot = snapSlotUnderPointer(e)
  if (!slot || isFlowChapterSlot(slot)) return

  const scrollEl = scrollTargetUnderPointer(e, slot)
  if (!scrollEl) return

  const slotFromEl = scrollEl.closest<HTMLElement>(CHAPTER_SLOT_SELECTOR)
  if (!slotFromEl || isFlowChapterSlot(slotFromEl)) return

  if (applyWheelScroll(scrollEl, e)) return
  handoffWheelAtCopyEdge(scrollEl, e)
}

export function ensureChapterCopyWheelListener(): () => void {
  if (listening || typeof window === 'undefined') {
    return () => {}
  }
  listening = true
  window.addEventListener('wheel', onWheelCapture, { passive: false, capture: true })
  return () => {
    window.removeEventListener('wheel', onWheelCapture, { capture: true })
    listening = false
  }
}
