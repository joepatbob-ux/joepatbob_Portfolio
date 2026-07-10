import { useEffect } from 'react'
import { resetAllChapterCopyScrollers } from '@/lib/scroll/chapterCopyScrollReset'
import {
  chapterSlotAtScrollY,
  chapterSlotScrollTop,
  scrollDocumentToChapterSlot,
} from '@/lib/scroll/chapterSnapScroll'
import { isContinuousChapters } from '@/lib/scroll/continuousChapters'
import { LAYOUT_MQ } from '@/lib/layout/breakpoints'

const CHAPTER_SLOT_SELECTOR = '.portfolio-chapter-slot[data-chapter-id]'
const SCROLL_TRAP_SELECTOR = '.chapter-copy-scroller'

/** Regions that keep native wheel behavior (sidebar, overlays, etc.). */
const WHEEL_IGNORE_SELECTOR =
  '.sidebar-shell, .sidebar-desktop-shell, .sidebar-desktop-subnav, .phone-swap__tune-panel, .phone-swap__devtools, .phone-swap__viewbox, .phone-swap__scene, .formation-lego__stage'

const HANDOFF_COOLDOWN_MS = 240
const EDGE_EPSILON_PX = 4

let bindGeneration = 0
let lastHandoffAt = 0

function chapterSlotsOrdered(): HTMLElement[] {
  return Array.from(
    document.querySelectorAll<HTMLElement>(CHAPTER_SLOT_SELECTOR),
  ).sort((a, b) => chapterSlotScrollTop(a) - chapterSlotScrollTop(b))
}

function isVerticallyScrollable(el: HTMLElement): boolean {
  return el.scrollHeight > el.clientHeight + EDGE_EPSILON_PX
}

function activeSlotIndex(slots: HTMLElement[], scrollY: number): number {
  const anchor = scrollY + window.innerHeight * 0.35
  let index = 0
  for (let i = 0; i < slots.length; i++) {
    if (chapterSlotScrollTop(slots[i]) <= anchor) index = i
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

function scrollToHero(): void {
  lastHandoffAt = Date.now()
  resetAllChapterCopyScrollers()
  window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
  requestAnimationFrame(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
  })
}

function firstChapterSlot(): HTMLElement | null {
  const slots = chapterSlotsOrdered()
  return slots[0] ?? null
}

/** Wheel up on the first chapter (overview) — fixed panel blocks native document scroll. */
function tryHeroHandoff(e: WheelEvent, handoffBlocked: boolean): boolean {
  if (e.deltaY >= 0 || window.scrollY <= 0) return false

  const target = e.target
  if (!(target instanceof HTMLElement)) return false
  if (target.closest(WHEEL_IGNORE_SELECTOR)) return false

  const first = firstChapterSlot()
  const active = chapterSlotAtScrollY()
  if (!first || active !== first) return false
  if (!target.closest('.portfolio-chapter-slot[data-chapter-id]')) return false

  const scroller = first.querySelector<HTMLElement>(SCROLL_TRAP_SELECTOR)
  if (scroller && isVerticallyScrollable(scroller)) {
    const atTop = scroller.scrollTop <= EDGE_EPSILON_PX
    if (!atTop) return false
  }

  if (handoffBlocked) return false

  e.preventDefault()
  e.stopPropagation()
  scrollToHero()
  return true
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
  const slot = target.closest(
    '.portfolio-chapter-slot--fill.hardware-slideshow[data-chapter-id]',
  )
  if (!slot) return false
  // Only trap wheel over the copy column — stage / canvas keeps native document scroll.
  return !!target.closest(
    '.chapter-slide__copy, .chapter-copy-scroller, .chapter-copy',
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

  const target = e.target
  if (target instanceof HTMLElement) {
    if (target.closest(WHEEL_IGNORE_SELECTOR)) return
    if (target.closest('#hero')) return
  }

  const handoffBlocked = Date.now() - lastHandoffAt < HANDOFF_COOLDOWN_MS

  if (tryHeroHandoff(e, handoffBlocked)) return

  if (!shouldRouteWheel(e)) return

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
    if (!next || handoffBlocked) return
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
  if (!previous) {
    if (tryHeroHandoff(e, handoffBlocked)) return
    return
  }
  if (handoffBlocked) return

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
      if (window.matchMedia(LAYOUT_MQ.topBarNav).matches || isContinuousChapters()) {
        return
      }
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
