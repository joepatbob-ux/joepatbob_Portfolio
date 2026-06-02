import type { CSSProperties } from 'react'

/** Scratch-off ticket artwork (Figma export). */

export const KELVIN_SCRATCH_TICKET_SRC =
  '/images/web-apps/scratch-ticket/ticket.svg'

export const KELVIN_SCRATCH_TICKET_DARK_SRC =
  '/images/web-apps/scratch-ticket/ticket-dark.svg'

export const KELVIN_SCRATCH_COVER_SRC =
  '/images/web-apps/scratch-ticket/cover.svg'

export const KELVIN_SCRATCH_COVER_DARK_SRC =
  '/images/web-apps/scratch-ticket/cover-dark.svg'

export const KELVIN_SCRATCH_REVEAL_SRC =
  '/images/web-apps/scratch-ticket/reveal.svg'

export const KELVIN_SCRATCH_REVEAL_DARK_SRC =
  '/images/web-apps/scratch-ticket/reveal-dark.svg'

export type KelvinScratchTheme = 'light' | 'dark'

export type KelvinScratchTicketSources = {
  ticket: string
  cover: string
  reveal: string
}

/** Ticket frame, foil cover, and reveal art for the active theme (dark = inverted). */
export function kelvinScratchTicketSources(
  theme: KelvinScratchTheme,
): KelvinScratchTicketSources {
  if (theme === 'dark') {
    return {
      ticket: KELVIN_SCRATCH_TICKET_DARK_SRC,
      cover: KELVIN_SCRATCH_COVER_DARK_SRC,
      reveal: KELVIN_SCRATCH_REVEAL_DARK_SRC,
    }
  }
  return {
    ticket: KELVIN_SCRATCH_TICKET_SRC,
    cover: KELVIN_SCRATCH_COVER_SRC,
    reveal: KELVIN_SCRATCH_REVEAL_SRC,
  }
}

export const SCRATCH_TICKET_VIEWBOX = {
  width: 805.73,
  height: 1274.34,
} as const

/** Coin tray strip on ticket art (coin-tray.svg height / ticket viewBox). */
export const SCRATCH_TICKET_TRAY_HEIGHT_RATIO =
  205.93 / SCRATCH_TICKET_VIEWBOX.height

export const SCRATCH_ZONE_VIEWBOX = {
  x: 25.87,
  y: 24.87,
  width: 754,
  height: 722,
} as const

export const SCRATCH_ZONE_ASPECT =
  SCRATCH_ZONE_VIEWBOX.width / SCRATCH_ZONE_VIEWBOX.height

export const SCRATCH_TICKET_VERDANT_HEIGHT_SCALE = 0.85

export const SCRATCH_TICKET_DISPLAY_MAX_PX = Math.round(
  480 *
    SCRATCH_TICKET_VERDANT_HEIGHT_SCALE *
    (SCRATCH_TICKET_VIEWBOX.width / SCRATCH_TICKET_VIEWBOX.height),
)

export function scratchZoneLayoutPercents() {
  return {
    left: (SCRATCH_ZONE_VIEWBOX.x / SCRATCH_TICKET_VIEWBOX.width) * 100,
    top: (SCRATCH_ZONE_VIEWBOX.y / SCRATCH_TICKET_VIEWBOX.height) * 100,
    width: (SCRATCH_ZONE_VIEWBOX.width / SCRATCH_TICKET_VIEWBOX.width) * 100,
    height: (SCRATCH_ZONE_VIEWBOX.height / SCRATCH_TICKET_VIEWBOX.height) * 100,
    aspect: SCRATCH_ZONE_ASPECT,
  }
}

const zoneLayoutPercents = scratchZoneLayoutPercents

/** CSS vars for absolutely positioning the scratch panel on the ticket frame. */
export function scratchZoneCssVars(): CSSProperties {
  const zone = zoneLayoutPercents()
  return {
    ['--kelvin-zone-left' as string]: `${zone.left}%`,
    ['--kelvin-zone-top' as string]: `${zone.top}%`,
    ['--kelvin-zone-width' as string]: `${zone.width}%`,
    ['--kelvin-zone-height' as string]: `${zone.height}%`,
  }
}

/** Coin + cursor size — scales with ticket width (tray sits below the ticket). */
export function coinDisplayPxForTicket(ticketWidthPx: number) {
  const fromWidth = ticketWidthPx * 0.16
  return Math.round(Math.min(72, Math.max(40, fromWidth)))
}

/** @deprecated Use coinDisplayPxForTicket */
export function coinDisplayPxFromTicketWidth(ticketWidthPx: number) {
  return coinDisplayPxForTicket(ticketWidthPx)
}

/** Root layout tokens for KelvinScratch (coin size + optional measured width). */
export function kelvinScratchRootStyle(
  coinDisplayPx: number,
  ticketWidthPx?: number,
  ticketHeightPx?: number,
): CSSProperties {
  return {
    ['--scratch-coin-size' as string]: `${coinDisplayPx}px`,
    ...(ticketWidthPx
      ? { ['--scratch-ticket-w' as string]: `${ticketWidthPx}px` }
      : {}),
    ...(ticketHeightPx
      ? { ['--scratch-ticket-h' as string]: `${Math.round(ticketHeightPx)}px` }
      : {}),
  }
}
