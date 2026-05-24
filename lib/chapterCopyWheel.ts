import {
  activeSlideIdPublished,
  CHAPTER_SLOT_SELECTOR,
} from '@/lib/chapterSlideshow'
import { LAYOUT_MQ } from '@/lib/layout/breakpoints'

let listening = false

function wheelDelta(e: WheelEvent, clientHeight: number): number {
  let delta = e.deltaY
  if (e.deltaMode === WheelEvent.DOM_DELTA_LINE) {
    delta *= 16
  } else if (e.deltaMode === WheelEvent.DOM_DELTA_PAGE) {
    delta *= clientHeight
  }
  return delta
}

function applyWheelScroll(el: HTMLElement, e: WheelEvent): boolean {
  const { scrollTop, scrollHeight, clientHeight } = el
  if (scrollHeight <= clientHeight + 1) return false

  const delta = wheelDelta(e, clientHeight)
  const atTop = scrollTop <= 0
  const atBottom = scrollTop + clientHeight >= scrollHeight - 1

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

/** Advance html scroll-snap when in-slide copy is at an edge. */
function scrollPageAtCopyEdge(el: HTMLElement, e: WheelEvent): boolean {
  const { scrollTop, scrollHeight, clientHeight } = el
  const delta = wheelDelta(e, clientHeight)
  const atTop = scrollTop <= 0
  const atBottom = scrollTop + clientHeight >= scrollHeight - 1

  const shortCopy = scrollHeight <= clientHeight + 1
  const exitDown = delta > 0 && (atBottom || shortCopy)
  const exitUp = delta < 0 && (atTop || shortCopy)
  if (!exitDown && !exitUp) return false

  const root = document.scrollingElement ?? document.documentElement
  root.scrollTop += delta
  e.preventDefault()
  e.stopPropagation()
  return true
}

function copyScrollerForActiveSlide(): HTMLElement | null {
  const activeId = activeSlideIdPublished()
  if (!activeId) return null

  const slot = document.querySelector<HTMLElement>(
    `${CHAPTER_SLOT_SELECTOR}[data-chapter-id="${activeId}"]`,
  )
  if (!slot) return null

  const panel = slot.querySelector<HTMLElement>('.portfolio-chapter-panel')
  if (panel?.getAttribute('aria-hidden') === 'true') return null

  return slot.querySelector<HTMLElement>('.chapter-copy-scroller')
}

function onWheelCapture(e: WheelEvent) {
  const el = copyScrollerForActiveSlide()
  if (!el) return

  const rect = el.getBoundingClientRect()
  if (
    e.clientX < rect.left ||
    e.clientX > rect.right ||
    e.clientY < rect.top ||
    e.clientY > rect.bottom
  ) {
    return
  }

  if (applyWheelScroll(el, e)) return
  scrollPageAtCopyEdge(el, e)
}

/** One listener for the whole site — ties in-slide copy scroll to scroll-snap active slide. */
export function ensureChapterCopyWheelListener(): () => void {
  if (listening || typeof window === 'undefined') {
    return () => {}
  }
  if (window.matchMedia(LAYOUT_MQ.mobile).matches) {
    return () => {}
  }
  listening = true
  window.addEventListener('wheel', onWheelCapture, { passive: false, capture: true })
  return () => {
    window.removeEventListener('wheel', onWheelCapture, { capture: true })
    listening = false
  }
}
