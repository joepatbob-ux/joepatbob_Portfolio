import { chapterSlotScrollTop } from '@/lib/scroll/chapterSnapScroll'

function sleep(ms: number) {
  return new Promise<void>((resolve) => {
    window.setTimeout(resolve, ms)
  })
}

/** Wait for a chapter slot to mount (e.g. after lazy section load). */
export async function waitForChapterSlot(
  chapterId: string,
  maxMs = 5000,
): Promise<HTMLElement | null> {
  const selector = `.portfolio-chapter-slot[data-chapter-id="${CSS.escape(chapterId)}"]`
  const deadline = Date.now() + maxMs

  while (Date.now() < deadline) {
    const el = document.querySelector<HTMLElement>(selector)
    if (el) return el
    await sleep(32)
  }

  return null
}

/** Wait until the slot has non-zero height and a stable document offset. */
async function waitForSlotLayoutStable(
  slot: HTMLElement,
  maxMs = 1200,
): Promise<void> {
  const deadline = performance.now() + maxMs
  let stableFrames = 0
  let lastTop = -1

  while (performance.now() < deadline) {
    await new Promise<void>((resolve) => {
      requestAnimationFrame(() => resolve())
    })

    const top = chapterSlotScrollTop(slot)
    const height = slot.getBoundingClientRect().height

    if (height > 0 && top === lastTop) {
      stableFrames += 1
      if (stableFrames >= 2) return
    } else {
      stableFrames = 0
      lastTop = top
    }
  }
}

/** Mount wait + layout stability — use before programmatic sidebar nav scroll. */
export async function waitForChapterSlotReady(
  chapterId: string,
  maxMs = 5000,
): Promise<HTMLElement | null> {
  const slot = await waitForChapterSlot(chapterId, maxMs)
  if (!slot) return null
  await waitForSlotLayoutStable(slot, Math.min(1200, maxMs))
  return slot
}
