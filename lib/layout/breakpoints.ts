/** Site shell breakpoints — keep CSS media queries aligned with these values. */

export const LAYOUT_BP = {
  mobileMax: 767,
  tabletMin: 768,
  tabletMax: 1023,
  desktopMin: 1024,
  /** Chapter slides use 1200 for a third copy column (see lib/chapter-slide/breakpoints.ts). */
  chapterWideMin: 1200,
  cinemaMin: 2560,
  siteFrameMax: 1400,
  sidebarWidthDesktop: 280,
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
} as const
