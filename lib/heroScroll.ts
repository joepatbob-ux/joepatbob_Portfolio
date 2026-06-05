import { easeChapterReveal } from '@/lib/chapterSlideshow'

/** Pinned hero layer bottom must pass this far above the viewport top before we leave. */
const HERO_LEAVE_BOTTOM_PX = -56
/** Re-enter only near the top — wide gap vs leaveScrollY stops rail toggling mid-handoff. */
const HERO_REENTER_SCROLL_TOP_PX = 96
/** Min visible hero height (px) to re-enter — avoids 8px peek re-triggering the rail. */
const HERO_REENTER_BOTTOM_MIN_PX = 120
/** Scroll (px) before hero portrait begins to fade. */
const HERO_PIN_FADE_START_PX = 24
/** Fade completes by this fraction of viewport height (before first chapter crossfade). */
const HERO_PIN_FADE_END_VH = 0.52
/** Chapter panels stay hidden until pin reveal drops below this. */
const HERO_PIN_CHAPTER_REVEAL_THRESHOLD = 0.06
/** Sidebar passthrough while pin reveal is above this. */
const HERO_PIN_SIDEBAR_PASSTHROUGH_THRESHOLD = 0.05

let heroZoneCommitted: boolean | null = null
let lastResizeInnerH = 0

/** Phone + tablet top-bar nav: scroll-Y hysteresis for hero intro vs frosted rail. */
let topBarHeroScrollCommitted: boolean | null = null

export function resetTopBarHeroScrollHysteresis(): void {
  topBarHeroScrollCommitted = null
}

/** Wider band than desktop hero zone — avoids rail ↔ hero flip on scroll reversal. */
export function isTopBarInHeroScrollZone(): boolean {
  if (typeof window === 'undefined') return true

  const y = window.scrollY
  const vh = window.innerHeight
  const leaveAt = vh * 0.48
  const enterAt = vh * 0.36

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

export function resetHeroScrollZoneHysteresis(): void {
  heroZoneCommitted = null
  resetTopBarHeroScrollHysteresis()
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
  return easeChapterReveal(linear)
}

export function getHeroPinReveal(scrollY: number, viewportH: number): number {
  return 1 - getHeroPinFadeOut(scrollY, viewportH)
}

/** Block chapter crossfade until the hero portrait has mostly faded out. */
export function shouldSuppressChapterReveal(): boolean {
  if (typeof window === 'undefined') return false
  return (
    getHeroPinReveal(window.scrollY, window.innerHeight) >
    HERO_PIN_CHAPTER_REVEAL_THRESHOLD
  )
}

/**
 * True while the hero portrait is still visible (sidebar passthrough / rail state).
 * Uses scroll fade + pin bottom so an opaque sidebar never covers a sharp portrait.
 */
export function isInHeroScrollZone(): boolean {
  if (typeof window === 'undefined') return false

  const scrollY = window.scrollY
  const viewportH = window.innerHeight
  const reveal = getHeroPinReveal(scrollY, viewportH)

  if (reveal > HERO_PIN_SIDEBAR_PASSTHROUGH_THRESHOLD) return true

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

  const shouldLeave = pinBottom < HERO_LEAVE_BOTTOM_PX
  const shouldEnter =
    pinBottom > reenterBottomPx && scrollY < HERO_REENTER_SCROLL_TOP_PX

  if (heroZoneCommitted === null) {
    heroZoneCommitted = !shouldLeave
  } else if (heroZoneCommitted) {
    if (shouldLeave) heroZoneCommitted = false
  } else if (shouldEnter) {
    heroZoneCommitted = true
  }

  return heroZoneCommitted
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
  const blur = fadeOut < 0.02 ? 0 : fadeOut * blurPx
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
  return easeChapterReveal(linear)
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
  const blur = fadeOut < 0.02 ? 0 : fadeOut * blurPx
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
  const blur = fadeOut < 0.02 ? 0 : fadeOut * blurPx

  el.style.opacity = String(reveal)
  el.style.filter = blur > 0 ? `blur(${blur}px)` : 'none'
  el.style.transform = 'none'
}
