import { hardware } from '@/lib/sections/hardware'

/** Scroll-snap targets in the Hardware case study (overview → chapters → lessons). */
export const HARDWARE_SCROLL_CHAPTERS = [
  { id: 'hardware-overview', label: 'Overview' },
  ...hardware.chapters.map((ch) => ({
    id: `hardware-${ch.id}`,
    label: ch.title,
  })),
  { id: 'hardware-lessons', label: 'Lessons' },
] as const

/** Closest hardware snap target to the viewport center. */
export function pickHardwareChapterFromScroll(): string {
  if (typeof window === 'undefined') return HARDWARE_SCROLL_CHAPTERS[0].id

  const vh = window.innerHeight
  const centerY = window.scrollY + vh / 2
  let bestId: string = HARDWARE_SCROLL_CHAPTERS[0].id
  let bestDist = Infinity

  for (const ch of HARDWARE_SCROLL_CHAPTERS) {
    const el = document.querySelector<HTMLElement>(`[data-chapter-id="${ch.id}"]`)
    if (!el) continue
    const rect = el.getBoundingClientRect()
    const mid = rect.top + window.scrollY + rect.height / 2
    const d = Math.abs(centerY - mid)
    if (d < bestDist) {
      bestDist = d
      bestId = ch.id
    }
  }

  return bestId
}
