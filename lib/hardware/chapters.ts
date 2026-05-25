import { LAYOUT_MQ } from '@/lib/layout/breakpoints'
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

/** Hardware chapter most visible on screen (mobile) or closest to viewport center. */
export function pickHardwareChapterFromScroll(): string {
  if (typeof window === 'undefined') return HARDWARE_SCROLL_CHAPTERS[0].id

  const vh = window.innerHeight
  const useVisibility =
    typeof window !== 'undefined' &&
    window.matchMedia(LAYOUT_MQ.mobile).matches

  let bestId: string = HARDWARE_SCROLL_CHAPTERS[0].id
  let bestScore = -1

  for (const ch of HARDWARE_SCROLL_CHAPTERS) {
    const el = document.querySelector<HTMLElement>(
      `.portfolio-chapter-slot[data-chapter-id="${ch.id}"]`,
    )
    if (!el) continue
    const rect = el.getBoundingClientRect()

    const score = useVisibility
      ? Math.max(0, Math.min(rect.bottom, vh) - Math.max(rect.top, 0))
      : -Math.abs(
          rect.top + window.scrollY + rect.height / 2 - (window.scrollY + vh / 2),
        )

    if (score > bestScore) {
      bestScore = score
      bestId = ch.id
    }
  }

  return bestId
}
