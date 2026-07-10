// Shared tokens for the sidebar nav family (shell, rail, subnav, hero name).

// Font strings (CSS vars: --font-ahg / --font-mono from globals + layout)
export const FONT_AHG = 'var(--font-ahg)'
export const FONT_MONO = 'var(--font-mono)'

export const ACCENT = 'var(--color-accent)'
export const INK = 'var(--color-ink)'
export const NAV_FADED = 'var(--color-nav-faded-selection)'
export const NAV_PILL_1 = 'var(--color-nav-pill-muted-accent-1)'

export const STAGGER_MS = 60
export const TRANSITION_MS = 320
export const MOBILE_SIDEBAR_MS = 420
export const SUBNAV_DELAY_MS = 280
export const BLUR_PX = 6
export const NAV_TOP_PX = 24
export const EMAIL_BOTTOM_PX = 24

/** Main nav section keywords: orange + opacity dimming when stuck. */
export function navKeywordStyle(opts: {
  dimActive: boolean
  isActive: boolean
  selectionExploringElsewhere: boolean
}): { color: string; opacity: number } {
  const { dimActive, isActive, selectionExploringElsewhere } = opts
  if (!dimActive) return { color: ACCENT, opacity: 1 }
  if (isActive) {
    return {
      color: selectionExploringElsewhere ? NAV_FADED : ACCENT,
      opacity: 1,
    }
  }
  return { color: NAV_FADED, opacity: 1 }
}
