import { easeChapterReveal } from '@/lib/chapterSlideshow'

/** Hero bottom must pass this far above the viewport top before we leave the zone. */
const HERO_LEAVE_BOTTOM_PX = -56
/** Scroll past hero height minus this before we leave (pairs with bottom threshold). */
const HERO_LEAVE_SCROLL_TAIL_PX = 80
/** Re-enter only near the top — wide gap vs leaveScrollY stops rail toggling mid-handoff. */
const HERO_REENTER_SCROLL_TOP_PX = 96
/** Min visible hero height (px) to re-enter — avoids 8px peek re-triggering the rail. */
const HERO_REENTER_BOTTOM_MIN_PX = 120

let heroZoneCommitted: boolean | null = null
let lastResizeInnerH = 0

export function resetHeroScrollZoneHysteresis(): void {
  heroZoneCommitted = null
}

function onViewportResize(): void {
  if (typeof window === 'undefined') return
  const innerH = window.innerHeight
  const prevInnerH = lastResizeInnerH
  const delta = Math.abs(innerH - prevInnerH)
  lastResizeInnerH = innerH
  if (prevInnerH > 0 && delta < 80) return
  resetHeroScrollZoneHysteresis()
}

if (typeof window !== 'undefined') {
  lastResizeInnerH = window.innerHeight
  window.addEventListener('resize', onViewportResize, { passive: true })
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
  const scrollY = window.scrollY
  const heroH = hero.offsetHeight
  const leaveScrollY = Math.max(0, heroH - HERO_LEAVE_SCROLL_TAIL_PX)
  const reenterBottomPx = Math.max(
    HERO_REENTER_BOTTOM_MIN_PX,
    window.innerHeight * 0.18,
  )

  const shouldLeave =
    bottom < HERO_LEAVE_BOTTOM_PX || scrollY > leaveScrollY
  const shouldEnter =
    bottom > reenterBottomPx && scrollY < HERO_REENTER_SCROLL_TOP_PX

  if (heroZoneCommitted === null) {
    heroZoneCommitted = !shouldLeave
  } else if (heroZoneCommitted) {
    if (shouldLeave) heroZoneCommitted = false
  } else if (shouldEnter) {
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
