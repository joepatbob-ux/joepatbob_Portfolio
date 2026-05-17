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
