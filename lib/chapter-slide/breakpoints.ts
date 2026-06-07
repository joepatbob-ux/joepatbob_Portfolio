/** Chapter slide layout breakpoints — keep media queries in styles/chapter/ aligned.
 *  Site shell (sidebar width): lib/layout/breakpoints.ts (tablet ends at 1023). */
export const CS_BP = {
  /** Single-column section (stage stacked above copy) */
  mobileMax: 767,
  /** Compact band (More/Less) ends at tablet — desktop slideshow starts at 1024 */
  tabletMax: 1023,
  /** Three-column section (stage | context | context) */
  wideMin: 1200,
} as const
