import { useEffect } from 'react'
import {
  chapterSlotAtScrollY,
  scrollDocumentToChapterSlot,
} from '@/lib/chapterSnapScroll'
import { LAYOUT_MQ } from '@/lib/layout/breakpoints'

const CHAPTER_SLOT_SELECTOR = '.portfolio-chapter-slot[data-chapter-id]'
const SCROLL_TRAP_SELECTOR = '.chapter-copy-scroller'

/** Regions that keep native wheel behavior (sidebar, overlays, etc.). */
const WHEEL_IGNORE_SELECTOR =
  '.sidebar-shell, .sidebar-desktop-shell, .sidebar-desktop-subnav, .contact-dialog, .phone-swap__tune-panel, .phone-swap__devtools'

const HANDOFF_COOLDOWN_MS = 240
const EDGE_EPSILON_PX = 4

let bindGeneration = 0
let lastHandoffAt = 0

function chapterSlotsOrdered(): HTMLElement[] {
  return Array.from(
    document.querySelectorAll<HTMLElement>(CHAPTER_SLOT_SELECTOR),
  ).sort((a, b) => a.offsetTop - b.offsetTop)
}

function isVerticallyScrollable(el: HTMLElement): boolean {
  return el.scrollHeight > el.clientHeight + EDGE_EPSILON_PX
}

function activeSlotIndex(slots: HTMLElement[], scrollY: number): number {
  const anchor = scrollY + window.innerHeight * 0.35
  let index = 0
  for (let i = 0; i < slots.length; i++) {
    if (slots[i].offsetTop <= anchor) index = i
  }
  return index
}

function nextChapterSlot(scrollY: number): HTMLElement | null {
  const slots = chapterSlotsOrdered()
  const idx = activeSlotIndex(slots, scrollY)
  return slots[idx + 1] ?? null
}

function previousChapterSlot(scrollY: number): HTMLElement | null {
  const slots = chapterSlotsOrdered()
  const idx = activeSlotIndex(slots, scrollY)
  return idx > 0 ? slots[idx - 1] : null
}

function scrollToChapterSlot(slot: HTMLElement): void {
  lastHandoffAt = Date.now()
  scrollDocumentToChapterSlot(slot)
}

/** Copy trap for the chapter at the current document scroll position — not nav highlight. */
function activeChapterCopyScroller(): HTMLElement | null {
  const slot = chapterSlotAtScrollY()
  return slot?.querySelector<HTMLElement>(SCROLL_TRAP_SELECTOR) ?? null
}

function shouldRouteWheel(e: WheelEvent): boolean {
  const target = e.target
  if (!(target instanceof HTMLElement)) return false
  if (target.closest(WHEEL_IGNORE_SELECTOR)) return false
  if (target.closest('#hero')) return false
  return !!target.closest(
    '.portfolio-chapter-slot--fill.hardware-slideshow[data-chapter-id]',
  )
}

function scrollCopyBy(scroller: HTMLElement, deltaY: number): void {
  scroller.scrollBy({ top: deltaY, left: 0 })
}

/**
 * Desktop slideshow: wheel scrolls long copy inside the slide first;
 * only at top/bottom edges does the page snap to the prev/next chapter.
 */
function onDocumentWheel(e: WheelEvent): void {
  if (e.deltaY === 0) return
  if (!shouldRouteWheel(e)) return
  if (Date.now() - lastHandoffAt < HANDOFF_COOLDOWN_MS) return

  const scroller = activeChapterCopyScroller()
  if (!scroller || !isVerticallyScrollable(scroller)) return

  const { scrollTop, scrollHeight, clientHeight } = scroller
  const atBottom =
    scrollTop + clientHeight >= scrollHeight - EDGE_EPSILON_PX
  const atTop = scrollTop <= EDGE_EPSILON_PX

  if (e.deltaY > 0) {
    if (!atBottom) {
      e.preventDefault()
      e.stopPropagation()
      scrollCopyBy(scroller, e.deltaY)
      return
    }

    const next = nextChapterSlot(window.scrollY)
    if (!next) return
    e.preventDefault()
    e.stopPropagation()
    scrollToChapterSlot(next)
    return
  }

  if (!atTop) {
    e.preventDefault()
    e.stopPropagation()
    scrollCopyBy(scroller, e.deltaY)
    return
  }

  const previous = previousChapterSlot(window.scrollY)
  if (!previous) return
  e.preventDefault()
  e.stopPropagation()
  scrollToChapterSlot(previous)
}

export function bindChapterCopyWheelHandlers(): () => void {
  const generation = ++bindGeneration
  const handler = (e: WheelEvent) => onDocumentWheel(e)

  window.addEventListener('wheel', handler, { passive: false, capture: true })

  return () => {
    if (bindGeneration === generation) {
      window.removeEventListener('wheel', handler, { capture: true })
    }
  }
}

export function useChapterCopyWheelTrap(): void {
  useEffect(() => {
    if (typeof window === 'undefined') return

    let cleanup: (() => void) | undefined

    const sync = () => {
      cleanup?.()
      cleanup = undefined
      if (window.matchMedia(LAYOUT_MQ.topBarNav).matches) return
      cleanup = bindChapterCopyWheelHandlers()
    }

    sync()
    const mq = window.matchMedia(LAYOUT_MQ.topBarNav)
    mq.addEventListener('change', sync)
    return () => {
      mq.removeEventListener('change', sync)
      cleanup?.()
    }
  }, [])
}
