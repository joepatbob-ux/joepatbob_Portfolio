import { hardware } from '@/lib/sections/hardware'

export const HARDWARE_SECTION_TABS = hardware.chapters.map((ch) => ({
  id: ch.id,
  label: ch.id === 'touch-2' ? 'Touch 2' : ch.title,
  chapterId: `hardware-${ch.id}`,
})) as readonly {
  id: string
  label: string
  chapterId: string
}[]

/** Scroll-snap targets in the Hardware case study (overview → product chapters). */
export const HARDWARE_SCROLL_CHAPTERS = [
  { id: 'hardware-overview', label: 'Overview' },
  ...HARDWARE_SECTION_TABS.map((t) => ({
    id: t.chapterId,
    label: t.label,
  })),
] as const

/** Closest hardware snap target to the viewport center. */
export function pickHardwareChapterFromScroll(): string {
  if (typeof window === 'undefined') return HARDWARE_SCROLL_CHAPTERS[0].id

  const vh = window.innerHeight
  const centerY = window.scrollY + vh / 2
  let bestId: string = HARDWARE_SCROLL_CHAPTERS[0].id
  let bestDist = Infinity

  for (const ch of HARDWARE_SCROLL_CHAPTERS) {
    const el = document.querySelector<HTMLElement>(
      `.portfolio-chapter-slot[data-chapter-id="${ch.id}"]`,
    )
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
