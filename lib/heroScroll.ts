function easeSmoothstep(t: number): number {
  const x = Math.max(0, Math.min(1, t))
  return x * x * (3 - 2 * x)
}

import { getLayoutViewportHeight } from '@/lib/mobileViewport'

function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

function layoutViewportH(): number {
  const h = getLayoutViewportHeight()
  return h > 0 ? h : window.innerHeight
}

/** Re-enter only near the top — wide gap vs leaveScrollY stops rail toggling mid-handoff. */
const HERO_REENTER_SCROLL_TOP_PX = 96
/** Min visible hero height (px) to re-enter — avoids 8px peek re-triggering the rail. */
const HERO_REENTER_BOTTOM_MIN_PX = 120
/** Scroll (px) before hero portrait begins to fade. */
const HERO_PIN_FADE_START_PX = 24
/** Fade completes by this fraction of viewport height (before first chapter crossfade). */
const HERO_PIN_FADE_END_VH = 0.38
/** Portrait considered gone below this — sidebar divider + chapter handoff. */
export const HERO_PIN_CHAPTER_REVEAL_THRESHOLD = 0.02
/** Scroll past hero fade before the first hardware panel ramps in (vh). */
export const HERO_CHAPTER_SCROLL_GATE_VH = 0.58

let heroZoneCommitted: boolean | null = null
let lastResizeInnerH = 0

/** Phone + tablet top-bar nav: scroll-Y hysteresis for hero intro vs frosted rail. */
let topBarHeroScrollCommitted: boolean | null = null

/** Leave hero intro → show top rail once hero bottom crosses this (vh). */
const TOP_BAR_HERO_LEAVE_VH = 0.5
/** Re-enter hero intro when hero bottom rises above this (vh). */
const TOP_BAR_HERO_ENTER_VH = 0.76

export function resetTopBarHeroScrollHysteresis(): void {
  topBarHeroScrollCommitted = null
}

/** Phone + tablet top-bar nav: stick until hero section has mostly scrolled away. */
export function isTopBarInHeroScrollZone(): boolean {
  if (typeof window === 'undefined') return true

  const hero = document.getElementById('hero')
  const vh = layoutViewportH()

  if (!hero) {
    const y = window.scrollY
    const leaveAt = vh * 0.65
    const enterAt = vh * 0.45

    if (topBarHeroScrollCommitted === null) {
      topBarHeroScrollCommitted = y < leaveAt
      return topBarHeroScrollCommitted
    }

    if (topBarHeroScrollCommitted) {
      if (y >= leaveAt) topBarHeroScrollCommitted = false
    } else if (y <= enterAt) {
      topBarHeroScrollCommitted = true
    }

    return topBarHeroScrollCommitted
  }

  const bottom = hero.getBoundingClientRect().bottom
  const leaveAt = vh * TOP_BAR_HERO_LEAVE_VH
  const enterAt = vh * TOP_BAR_HERO_ENTER_VH

  if (topBarHeroScrollCommitted === null) {
    topBarHeroScrollCommitted = bottom > leaveAt
    return topBarHeroScrollCommitted
  }

  if (topBarHeroScrollCommitted) {
    if (bottom <= leaveAt) topBarHeroScrollCommitted = false
  } else if (bottom >= enterAt) {
    topBarHeroScrollCommitted = true
  }

  return topBarHeroScrollCommitted
}

export function resetHeroScrollZoneHysteresis(): void {
  heroZoneCommitted = null
  resetTopBarHeroScrollHysteresis()
}

function onViewportResize(): void {
  if (typeof window === 'undefined') return
  const innerH = layoutViewportH()
  const prevInnerH = lastResizeInnerH
  const delta = Math.abs(innerH - prevInnerH)
  lastResizeInnerH = innerH
  if (prevInnerH > 0 && delta < 24) return
  resetHeroScrollZoneHysteresis()
}

if (typeof window !== 'undefined') {
  lastResizeInnerH = layoutViewportH()
  window.addEventListener('resize', onViewportResize, { passive: true })
  window.visualViewport?.addEventListener('resize', onViewportResize, {
    passive: true,
  })
}

function heroPinBottom(hero: HTMLElement): number {
  const pin = hero.querySelector<HTMLElement>('.hero-pin')
  return pin?.getBoundingClientRect().bottom ?? hero.getBoundingClientRect().bottom
}

/** 0 = fully faded, 1 = full hero portrait. */
export function getHeroPinFadeOut(scrollY: number, viewportH: number): number {
  const end = viewportH * HERO_PIN_FADE_END_VH
  const span = Math.max(1, end - HERO_PIN_FADE_START_PX)
  const linear = Math.min(
    1,
    Math.max(0, (scrollY - HERO_PIN_FADE_START_PX) / span),
  )
  return easeSmoothstep(linear)
}

export function getHeroPinReveal(scrollY: number, viewportH: number): number {
  return 1 - getHeroPinFadeOut(scrollY, viewportH)
}

/** 0–1 ramp for the first snap slide after hero (portrait + scroll gate). */
export function heroChapterHandoffProgress(
  scrollY: number,
  viewportH: number,
  firstSlotCenterY: number,
): number {
  if (viewportH <= 0) return 0

  const reveal = getHeroPinReveal(scrollY, viewportH)
  if (reveal > HERO_PIN_CHAPTER_REVEAL_THRESHOLD) return 0

  const scrollStart = viewportH * HERO_CHAPTER_SCROLL_GATE_VH
  const scrollEnd = firstSlotCenterY - viewportH / 2
  if (scrollY <= scrollStart) return 0
  if (scrollEnd <= scrollStart) return 1

  const t = (scrollY - scrollStart) / (scrollEnd - scrollStart)
  return easeSmoothstep(Math.min(1, Math.max(0, t)))
}

/** Block chapter crossfade until the hero portrait has fully faded and scroll clears the gate. */
export function shouldSuppressChapterReveal(): boolean {
  if (typeof window === 'undefined') return false

  const scrollY = window.scrollY
  const viewportH = window.innerHeight
  if (viewportH <= 0) return false

  if (
    getHeroPinReveal(scrollY, viewportH) > HERO_PIN_CHAPTER_REVEAL_THRESHOLD
  ) {
    return true
  }

  return scrollY < viewportH * HERO_CHAPTER_SCROLL_GATE_VH
}

/**
 * True while the hero portrait is still visible (sidebar passthrough / rail state).
 * Pin fade drives leave — fixed `.hero-pin` never crosses HERO_LEAVE_BOTTOM_PX.
 */
export function isInHeroScrollZone(): boolean {
  if (typeof window === 'undefined') return false

  const scrollY = window.scrollY
  const viewportH = window.innerHeight
  const reveal = getHeroPinReveal(scrollY, viewportH)

  if (reveal > HERO_PIN_CHAPTER_REVEAL_THRESHOLD) {
    heroZoneCommitted = true
    return true
  }

  const hero = document.getElementById('hero')
  if (!hero) {
    const fallback = scrollY < viewportH * 0.85
    if (heroZoneCommitted === null) heroZoneCommitted = fallback
    return heroZoneCommitted
  }

  const pinBottom = heroPinBottom(hero)
  const reenterBottomPx = Math.max(
    HERO_REENTER_BOTTOM_MIN_PX,
    viewportH * 0.18,
  )
  const shouldEnter =
    pinBottom > reenterBottomPx && scrollY < HERO_REENTER_SCROLL_TOP_PX

  if (shouldEnter) {
    heroZoneCommitted = true
    return true
  }

  heroZoneCommitted = false
  return false
}

/** Scroll-linked fade on `.hero-pin` (`.hero-media` canvas + portrait together). */
export function applyHeroPinFade(
  el: HTMLElement | null,
  scrollY: number,
  viewportH: number,
  blurPx = 10,
): void {
  if (!el) return

  if (scrollY < 4) {
    resetHeroPinFade(el)
    return
  }

  const fadeOut = getHeroPinFadeOut(scrollY, viewportH)
  const reveal = 1 - fadeOut
  const reduced = prefersReducedMotion()
  const blur = reduced || fadeOut < 0.02 ? 0 : fadeOut * blurPx
  const opacityStr = String(reveal)
  const filterStr = blur > 0 ? `blur(${blur}px)` : 'none'
  const pointerEvents = reveal < 0.02 ? 'none' : ''

  if (
    el.style.opacity === opacityStr &&
    el.style.filter === filterStr &&
    el.style.pointerEvents === pointerEvents
  ) {
    return
  }

  el.style.opacity = opacityStr
  el.style.filter = filterStr
  el.style.pointerEvents = pointerEvents
}

export function resetHeroPinFade(el: HTMLElement | null): void {
  if (!el) return
  el.style.opacity = '1'
  el.style.filter = 'none'
  el.style.pointerEvents = ''
}

const HERO_NAME_FADE_VH = 0.62

function sidebarNameFadeProgress(scrollY: number, viewportH: number): number {
  const linear = Math.min(
    1,
    Math.max(0, (scrollY - 20) / (viewportH * HERO_NAME_FADE_VH)),
  )
  return easeSmoothstep(linear)
}

export function getSidebarHeroFadeProgress(
  scrollY: number,
  viewportH: number,
): number {
  return sidebarNameFadeProgress(scrollY, viewportH)
}

/** Sidebar “Hello, I am” block — fade/blur on scroll. */
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
  const reduced = prefersReducedMotion()
  const blur = reduced || fadeOut < 0.02 ? 0 : fadeOut * blurPx
  const opacityStr = String(reveal)
  const filterStr = blur > 0 ? `blur(${blur}px)` : 'none'

  if (el.style.opacity === opacityStr && el.style.filter === filterStr) return

  el.style.opacity = opacityStr
  el.style.filter = filterStr
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
  const reduced = prefersReducedMotion()
  const blur = reduced || fadeOut < 0.02 ? 0 : fadeOut * blurPx

  el.style.opacity = String(reveal)
  el.style.filter = blur > 0 ? `blur(${blur}px)` : 'none'
  el.style.transform = 'none'
}
