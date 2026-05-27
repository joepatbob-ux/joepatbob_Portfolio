import {
  activeSlideIdPublished,
  CHAPTER_SLOT_SELECTOR,
} from '@/lib/chapterSlideshow'
import { isFlowChapterSlot } from '@/lib/chapterFlow'

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

function chapterSlotsInOrder(): HTMLElement[] {
  return Array.from(
    document.querySelectorAll<HTMLElement>(CHAPTER_SLOT_SELECTOR),
  )
}

function adjacentChapterSlot(
  slot: HTMLElement,
  direction: 1 | -1,
): HTMLElement | null {
  const slots = chapterSlotsInOrder()
  const idx = slots.indexOf(slot)
  if (idx < 0) return null
  return slots[idx + direction] ?? null
}

function slotDocTop(slot: HTMLElement): number {
  return slot.getBoundingClientRect().top + window.scrollY
}

/** Advance document scroll when in-slide copy is at an edge (or has no overflow). */
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
  const slot = el.closest<HTMLElement>(CHAPTER_SLOT_SELECTOR)

  if (slot && isFlowChapterSlot(slot)) {
    const next = adjacentChapterSlot(slot, exitDown ? 1 : -1)
    if (next) {
      e.preventDefault()
      e.stopPropagation()
      const targetTop = slotDocTop(next)
      if (exitDown) {
        root.scrollTop = Math.min(
          targetTop,
          root.scrollTop + Math.max(Math.abs(delta), 48),
        )
      } else {
        root.scrollTop = Math.max(
          targetTop,
          root.scrollTop - Math.max(Math.abs(delta), 48),
        )
      }
      return true
    }
  }

  root.scrollTop += delta
  e.preventDefault()
  e.stopPropagation()
  return true
}

function isPanelHidden(slot: HTMLElement): boolean {
  const panel = slot.querySelector<HTMLElement>('.portfolio-chapter-panel')
  return panel?.getAttribute('aria-hidden') === 'true'
}

function copyScrollerForActiveSlide(): HTMLElement | null {
  const activeId = activeSlideIdPublished()
  if (!activeId) return null

  const slot = document.querySelector<HTMLElement>(
    `${CHAPTER_SLOT_SELECTOR}[data-chapter-id="${activeId}"]`,
  )
  if (!slot || isPanelHidden(slot)) return null

  return slot.querySelector<HTMLElement>('.chapter-copy-scroller')
}

/** Prefer the copy scroller under the pointer (stacked / in-flow sections). */
function copyScrollerAtWheelTarget(e: WheelEvent): HTMLElement | null {
  const x = e.clientX
  const y = e.clientY
  let best: HTMLElement | null = null
  let bestArea = 0

  document
    .querySelectorAll<HTMLElement>(
      `${CHAPTER_SLOT_SELECTOR} .chapter-copy-scroller`,
    )
    .forEach((el) => {
      const slot = el.closest<HTMLElement>(CHAPTER_SLOT_SELECTOR)
      if (!slot || isPanelHidden(slot)) return

      const rect = el.getBoundingClientRect()
      if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
        return
      }

      const area = rect.width * rect.height
      if (area > bestArea) {
        bestArea = area
        best = el
      }
    })

  return best ?? copyScrollerForActiveSlide()
}

function onWheelCapture(e: WheelEvent) {
  const el = copyScrollerAtWheelTarget(e)
  if (!el) return

  if (applyWheelScroll(el, e)) return
  scrollPageAtCopyEdge(el, e)
}

/** One listener for the whole site — ties in-slide copy scroll to the next chapter. */
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
