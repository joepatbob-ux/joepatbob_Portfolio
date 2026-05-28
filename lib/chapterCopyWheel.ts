import { useEffect } from 'react'
const CHAPTER_SLOT_SELECTOR = '.portfolio-chapter-slot'
const SCROLL_TRAP_SELECTOR =
  '.chapter-copy-scroller, .portfolio-chapter-panel'

let bindGeneration = 0

function chapterSlotsOrdered(): HTMLElement[] {
  return Array.from(
    document.querySelectorAll<HTMLElement>(CHAPTER_SLOT_SELECTOR),
  ).sort((a, b) => a.offsetTop - b.offsetTop)
}

function nextChapterSlot(scrollY: number): HTMLElement | null {
  return chapterSlotsOrdered().find((slot) => slot.offsetTop > scrollY) ?? null
}

function previousChapterSlot(scrollY: number): HTMLElement | null {
  const slots = chapterSlotsOrdered()
  let previous: HTMLElement | null = null
  for (const slot of slots) {
    if (slot.offsetTop < scrollY) {
      previous = slot
    } else {
      break
    }
  }
  return previous
}

function onWheelAtScrollEdge(el: HTMLElement, e: WheelEvent): void {
  if (e.deltaY === 0) return

  const { scrollTop, scrollHeight, clientHeight } = el
  const atBottom = scrollTop + clientHeight >= scrollHeight - 1
  const atTop = scrollTop <= 0

  if (e.deltaY > 0 && atBottom) {
    e.preventDefault()
    e.stopPropagation()
    const next = nextChapterSlot(window.scrollY)
    if (next) {
      window.scrollTo({ top: next.offsetTop, behavior: 'smooth' })
    }
    return
  }

  if (e.deltaY < 0 && atTop) {
    e.preventDefault()
    e.stopPropagation()
    const previous = previousChapterSlot(window.scrollY)
    if (previous) {
      window.scrollTo({ top: previous.offsetTop, behavior: 'smooth' })
    }
  }
}

/** Attach wheel handoff listeners to all copy scrollers and chapter panels. */
export function bindChapterCopyWheelHandlers(): () => void {
  const generation = ++bindGeneration
  const cleanups: (() => void)[] = []

  document.querySelectorAll<HTMLElement>(SCROLL_TRAP_SELECTOR).forEach((el) => {
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

/**
 * Re-bind wheel traps when chapter DOM mounts or unmounts (lazy sections, inserts).
 */
export function useChapterCopyWheelTrap(): void {
  useEffect(() => {
    if (typeof window === 'undefined') return

    let unbind = bindChapterCopyWheelHandlers()
    let debounceId = 0

    const scheduleRebind = () => {
      window.clearTimeout(debounceId)
      debounceId = window.setTimeout(() => {
        unbind()
        unbind = bindChapterCopyWheelHandlers()
      }, 0)
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
