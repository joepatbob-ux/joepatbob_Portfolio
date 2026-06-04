/** Chapter slide layout breakpoints — keep media queries in chapter-slide.css aligned.
 *  Site shell (sidebar width): lib/layout/breakpoints.ts (tablet ends at 1023). */
export const CS_BP = {
  /** Single-column section (stage stacked above copy) */
  mobileMax: 767,
  /** Two-column section (stage | copy); copy drawer above wideMin — lib/hooks/useLayoutCopyDrawer */
  tabletMax: 1199,
  /** Three-column section (stage | context | context) */
  wideMin: 1200,
} as const
