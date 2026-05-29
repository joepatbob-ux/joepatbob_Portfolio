import { easeChapterReveal } from '@/lib/chapterSlideshow'

/** Hero bottom must pass this far above the viewport top before we leave the zone. */
const HERO_LEAVE_BOTTOM_PX = -56
/** Re-enter only when the hero spacer intrudes back into view by at least this much. */
const HERO_ENTER_BOTTOM_PX = 8

let heroZoneCommitted: boolean | null = null

export function resetHeroScrollZoneHysteresis(): void {
  heroZoneCommitted = null
}

if (typeof window !== 'undefined') {
  window.addEventListener('resize', resetHeroScrollZoneHysteresis, { passive: true })
}

/**
 * True while the hero spacer still intersects the viewport (canvas + portrait
 * stay locked; chapter panels stay hidden until the hero has fully scrolled away).
 *
 * Uses hysteresis on hero bottom so mobile address-bar resize / layout shifts
 * do not flip nav visibility at the boundary.
 */
export function isInHeroScrollZone(): boolean {
  if (typeof window === 'undefined') return false

  const hero = document.getElementById('hero')
  if (!hero) {
    const fallback = window.scrollY < window.innerHeight * 0.85
    if (heroZoneCommitted === null) heroZoneCommitted = fallback
    return heroZoneCommitted
  }

  const bottom = hero.getBoundingClientRect().bottom

  if (heroZoneCommitted === null) {
    heroZoneCommitted = bottom > HERO_ENTER_BOTTOM_PX
    return heroZoneCommitted
  }

  if (heroZoneCommitted) {
    if (bottom < HERO_LEAVE_BOTTOM_PX) heroZoneCommitted = false
  } else if (bottom > HERO_ENTER_BOTTOM_PX) {
    heroZoneCommitted = true
  }

  return heroZoneCommitted
}

const HERO_NAME_FADE_VH = 0.62

function sidebarNameFadeProgress(scrollY: number, viewportH: number): number {
  const linear = Math.min(
    1,
    Math.max(0, (scrollY - 20) / (viewportH * HERO_NAME_FADE_VH)),
  )
  return easeChapterReveal(linear)
}

export function getSidebarHeroFadeProgress(
  scrollY: number,
  viewportH: number,
): number {
  return sidebarNameFadeProgress(scrollY, viewportH)
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
  applySidebarRevealFade(el, fadeOut, blurPx)
}

/** Whole sidebar shell — tablet hero uses this so nav + contact fade together. */
export function applySidebarShellFade(
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
}

export function resetSidebarShellFade(el: HTMLElement | null): void {
  if (!el) return
  el.style.opacity = '1'
  el.style.filter = 'none'
}

/** Tablet rail handoff — keep shell hidden (avoid reset-to-opaque flash leaving hero). */
export function hideSidebarShell(el: HTMLElement | null): void {
  if (!el) return
  el.style.opacity = '0'
  el.style.filter = 'none'
}

function applySidebarRevealFade(
  el: HTMLElement,
  fadeOut: number,
  blurPx: number,
): void {
  const reveal = 1 - fadeOut
  const blur = fadeOut < 0.02 ? 0 : fadeOut * blurPx

  el.style.opacity = String(reveal)
  el.style.filter = blur > 0 ? `blur(${blur}px)` : 'none'
  el.style.transform = 'none'
}
