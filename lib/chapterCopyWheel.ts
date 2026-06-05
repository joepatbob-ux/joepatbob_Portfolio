import { useEffect } from 'react'
import { LAYOUT_MQ } from '@/lib/layout/breakpoints'

const CHAPTER_SLOT_SELECTOR = '.portfolio-chapter-slot[data-chapter-id]'

/** Only nested copy scrollers — never the fixed panel (avoids scroll fighting). */
const SCROLL_TRAP_SELECTOR = '.chapter-copy-scroller'

const HANDOFF_COOLDOWN_MS = 560
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
  const top = slot.offsetTop
  window.scrollTo({ top, left: 0, behavior: 'auto' })
}

function onWheelAtScrollEdge(el: HTMLElement, e: WheelEvent): void {
  if (e.deltaY === 0) return
  if (!isVerticallyScrollable(el)) return
  if (Date.now() - lastHandoffAt < HANDOFF_COOLDOWN_MS) return

  const { scrollTop, scrollHeight, clientHeight } = el
  const atBottom =
    scrollTop + clientHeight >= scrollHeight - EDGE_EPSILON_PX
  const atTop = scrollTop <= EDGE_EPSILON_PX

  if (e.deltaY > 0 && atBottom) {
    const next = nextChapterSlot(window.scrollY)
    if (!next) return
    e.preventDefault()
    e.stopPropagation()
    scrollToChapterSlot(next)
    return
  }

  if (e.deltaY < 0 && atTop) {
    const previous = previousChapterSlot(window.scrollY)
    if (!previous) return
    e.preventDefault()
    e.stopPropagation()
    scrollToChapterSlot(previous)
  }
}

function scrollTrapTargets(): HTMLElement[] {
  return Array.from(
    document.querySelectorAll<HTMLElement>(SCROLL_TRAP_SELECTOR),
  ).filter(isVerticallyScrollable)
}

export function bindChapterCopyWheelHandlers(): () => void {
  const generation = ++bindGeneration
  const cleanups: (() => void)[] = []

  scrollTrapTargets().forEach((el) => {
    const handler = (e: WheelEvent) => onWheelAtScrollEdge(el, e)
    el.addEventListener('wheel', handler, { passive: false })
    cleanups.push(() => el.removeEventListener('wheel', handler))
  })

  return () => {
    if (bindGeneration === generation) {
      cleanups.forEach((off) => off())
    }
  }
}

export function useChapterCopyWheelTrap(): void {
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (window.matchMedia(LAYOUT_MQ.topBarNav).matches) return

    let unbind = bindChapterCopyWheelHandlers()
    let debounceId = 0
    let trapCount = scrollTrapTargets().length

    const scheduleRebind = () => {
      window.clearTimeout(debounceId)
      debounceId = window.setTimeout(() => {
        const nextCount = scrollTrapTargets().length
        if (nextCount === trapCount) return
        trapCount = nextCount
        unbind()
        unbind = bindChapterCopyWheelHandlers()
      }, 120)
    }

    const root =
      document.querySelector<HTMLElement>('.content-area') ?? document.body

    const observer = new MutationObserver(scheduleRebind)
    observer.observe(root, { childList: true, subtree: true })

    return () => {
      window.clearTimeout(debounceId)
      observer.disconnect()
      unbind()
    }
  }, [])
}
