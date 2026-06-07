const SCROLL_TRAP_SELECTOR = '.chapter-copy-scroller'

import { chapterSlotScrollTop } from '@/lib/chapterSnapScroll'

const SCROLL_SETTLE_TOLERANCE_PX = 8
const SCROLL_SETTLE_MAX_MS = 900

/** Reset inner copy scroll positions — document scroll must not inherit nested trap position. */
export function resetChapterCopyScrollers(root: ParentNode): void {
  root.querySelectorAll<HTMLElement>(SCROLL_TRAP_SELECTOR).forEach((el) => {
    el.scrollTop = 0
  })
}

/** Reset every chapter copy trap — prevents a prior slide's scroll position from bleeding through. */
export function resetAllChapterCopyScrollers(): void {
  document.querySelectorAll<HTMLElement>(SCROLL_TRAP_SELECTOR).forEach((el) => {
    el.scrollTop = 0
  })
}

export function resetChapterCopyScrollersForChapter(chapterId: string): void {
  const slot = document.querySelector<HTMLElement>(
    `.portfolio-chapter-slot[data-chapter-id="${CSS.escape(chapterId)}"]`,
  )
  if (slot) resetChapterCopyScrollers(slot)
}

/** After document snap — reset immediately and on subsequent frames (layout/snap can run late). */
export function resetChapterCopyScrollersAfterSnap(_root?: ParentNode): void {
  resetAllChapterCopyScrollers()
  requestAnimationFrame(() => {
    resetAllChapterCopyScrollers()
    requestAnimationFrame(() => {
      resetAllChapterCopyScrollers()
    })
  })
}

/** Wait until document scrollY matches the chapter slot (mandatory snap can settle async). */
export function waitForChapterScrollSettle(slot: HTMLElement): Promise<void> {
  const expectedTop = chapterSlotScrollTop(slot)

  return new Promise((resolve) => {
    const start = performance.now()

    const tick = () => {
      if (Math.abs(window.scrollY - expectedTop) <= SCROLL_SETTLE_TOLERANCE_PX) {
        resolve()
        return
      }
      if (performance.now() - start >= SCROLL_SETTLE_MAX_MS) {
        resolve()
        return
      }
      requestAnimationFrame(tick)
    }

    tick()
  })
}
