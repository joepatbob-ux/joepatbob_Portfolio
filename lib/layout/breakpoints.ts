/** Site shell breakpoints — keep CSS media queries aligned with these values. */

import { CS_BP } from '@/lib/chapter-slide/breakpoints'

export const LAYOUT_BP = {
  mobileMax: 767,
  tabletMin: 768,
  tabletMax: 1023,
  desktopMin: 1024,
  /** Chapter slides use 1200 for a third copy column (see lib/chapter-slide/breakpoints.ts). */
  chapterWideMin: 1200,
  cinemaMin: 2560,
  siteFrameMax: 1400,
  /** Desktop shell (1024–2559): divider at 280px rail */
  sidebarWidthDesktop: 280,
  sidebarPadInlineDesktop: 32,
  sidebarPadToDividerDesktop: 20,
  contentPadEndDesktop: 32,
  stageCopyGapDesktop: 20,
  /** Collapsed tablet rail width (768–1023) */
  sidebarWidthCollapsed: 52,
  sidebarOverlayWidth: 280,
} as const

/** Media query strings for JS `matchMedia` / `window.matchMedia`. */
export const LAYOUT_MQ = {
  mobile: `(max-width: ${LAYOUT_BP.mobileMax}px)`,
  tablet: `(min-width: ${LAYOUT_BP.tabletMin}px) and (max-width: ${LAYOUT_BP.tabletMax}px)`,
  tabletUp: `(min-width: ${LAYOUT_BP.tabletMin}px)`,
  desktop: `(min-width: ${LAYOUT_BP.desktopMin}px)`,
  /** Centered stack + More/Less expand — lib/hooks/useLayoutCompactBand (768–1023). */
  compactBand: `(min-width: ${LAYOUT_BP.tabletMin}px) and (max-width: ${CS_BP.tabletMax}px)`,
  /** Mobile + tablet top-bar nav (≤1023) — SidebarNav overlay drawer. */
  topBarNav: `(max-width: ${LAYOUT_BP.tabletMax}px)`,
  cinema: `(min-width: ${LAYOUT_BP.cinemaMin}px)`,
} as const

export function isCinemaViewport(): boolean {
  if (typeof window === 'undefined') return false
  return window.matchMedia(LAYOUT_MQ.cinema).matches
}
