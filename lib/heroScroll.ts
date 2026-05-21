import { easeChapterReveal } from '@/lib/chapterSlideshow'

/**
 * True while the hero spacer still intersects the viewport (canvas + portrait
 * stay locked; chapter panels stay hidden until the hero has fully scrolled away).
 */
export function isInHeroScrollZone(): boolean {
  if (typeof window === 'undefined') return false

  const hero = document.getElementById('hero')
  if (!hero) return window.scrollY < window.innerHeight

  return hero.getBoundingClientRect().bottom > 0
}

const HERO_NAME_FADE_VH = 0.62

function sidebarNameFadeProgress(scrollY: number, viewportH: number): number {
  const linear = Math.min(
    1,
    Math.max(0, (scrollY - 20) / (viewportH * HERO_NAME_FADE_VH)),
  )
  return easeChapterReveal(linear)
}

/** Sidebar “Hello, I am” block — fade/blur on scroll (hero portrait stays sharp). */
export function applySidebarHeroNameFade(
  el: HTMLElement | null,
  scrollY: number,
  viewportH: number,
  blurPx: number,
): void {
  if (!el) return

  const fadeOut = sidebarNameFadeProgress(scrollY, viewportH)
  const reveal = 1 - fadeOut
  const blur = fadeOut < 0.02 ? 0 : fadeOut * blurPx

  el.style.opacity = String(reveal)
  el.style.filter = blur > 0 ? `blur(${blur}px)` : 'none'
  el.style.transform = 'none'
}
