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
