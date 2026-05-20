/** Chapter slide layout breakpoints — keep media queries in globals.css aligned. */
export const CS_BP = {
  /** Single-column section (stage stacked above copy) */
  mobileMax: 767,
  /** Two-column section (stage | copy) */
  tabletMax: 1199,
  /** Three-column section (stage | context | context) */
  wideMin: 1200,
} as const
