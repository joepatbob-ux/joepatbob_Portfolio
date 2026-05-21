let publishedRevealMap: Record<string, number> = {}

/** Latest scroll reveal map (one compute per frame from ChapterNavProvider). */
export function publishChapterRevealMap(map: Record<string, number>): void {
  publishedRevealMap = map
}

export function chapterRevealForId(chapterId: string): number {
  return publishedRevealMap[chapterId] ?? 0
}

/** Chapter slide whose document center is closest to this Y (page coordinates). */
export function nearestChapterIdForDocY(docY: number): string | null {
  const slots = document.querySelectorAll<HTMLElement>('[data-chapter-id]')
  let bestId: string | null = null
  let bestDist = Infinity

  slots.forEach((el) => {
    const id = el.dataset.chapterId
    if (!id) return
    const rect = el.getBoundingClientRect()
    const centerY = rect.top + window.scrollY + rect.height / 2
    const d = Math.abs(docY - centerY)
    if (d < bestDist) {
      bestDist = d
      bestId = id
    }
  })

  return bestId
}

/** Smooth 0→1 easing for scroll-driven panel reveal. */
export function easeChapterReveal(t: number): number {
  const x = Math.max(0, Math.min(1, t))
  return x * x * (3 - 2 * x)
}

type SlideAnchor = { id: string; centerY: number }

function slideAnchors(): SlideAnchor[] {
  return Array.from(document.querySelectorAll<HTMLElement>('[data-chapter-id]'))
    .map((el) => {
      const id = el.dataset.chapterId
      if (!id) return null
      const rect = el.getBoundingClientRect()
      return {
        id,
        centerY: rect.top + window.scrollY + rect.height / 2,
      }
    })
    .filter((s): s is SlideAnchor => s !== null)
}

/**
 * Opacity per chapter from scroll position (panels stay fixed; only reveal changes).
 * At most two adjacent chapters blend during a scroll transition.
 */
export function computeChapterRevealMap(): Record<string, number> {
  const slots = slideAnchors()
  if (!slots.length) return {}

  const map: Record<string, number> = {}
  slots.forEach((s) => {
    map[s.id] = 0
  })

  const centerY = window.scrollY + window.innerHeight / 2

  if (centerY <= slots[0].centerY) {
    map[slots[0].id] = 1
    return map
  }

  const last = slots[slots.length - 1]
  if (centerY >= last.centerY) {
    map[last.id] = 1
    return map
  }

  for (let i = 0; i < slots.length - 1; i++) {
    const a = slots[i]
    const b = slots[i + 1]
    if (centerY >= a.centerY && centerY <= b.centerY) {
      const span = b.centerY - a.centerY
      const t = span > 0 ? (centerY - a.centerY) / span : 0
      const eased = easeChapterReveal(t)
      map[a.id] = 1 - eased
      map[b.id] = eased
      return map
    }
  }

  let best = slots[0]
  let bestDist = Infinity
  for (const s of slots) {
    const d = Math.abs(centerY - s.centerY)
    if (d < bestDist) {
      bestDist = d
      best = s
    }
  }
  map[best.id] = 1
  return map
}

/** Closest chapter slide to the viewport center (slideshow active index). */
export function pickActiveSlideId(): string | null {
  const slots = document.querySelectorAll<HTMLElement>('[data-chapter-id]')
  if (!slots.length) return null

  const vh = window.innerHeight
  const viewportCenter = vh / 2
  let bestId: string | null = null
  let bestDistance = Infinity

  slots.forEach((el) => {
    const id = el.dataset.chapterId
    if (!id) return
    const rect = el.getBoundingClientRect()
    if (rect.bottom <= 0 || rect.top >= vh) return

    const slideCenter = rect.top + rect.height / 2
    const distance = Math.abs(slideCenter - viewportCenter)
    if (distance < bestDistance) {
      bestDistance = distance
      bestId = id
    }
  })

  return bestId
}
