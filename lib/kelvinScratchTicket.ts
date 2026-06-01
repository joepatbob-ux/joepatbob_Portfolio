/** Scratch-off ticket artwork (Figma export). */

export const KELVIN_SCRATCH_TICKET_SRC =
  '/images/web-apps/scratch-ticket/ticket.svg'

export const KELVIN_SCRATCH_COVER_SRC =
  '/images/web-apps/scratch-ticket/cover.svg'

export const KELVIN_SCRATCH_REVEAL_SRC =
  '/images/web-apps/scratch-ticket/reveal.svg'

/** Full ticket artboard (Scratchoff_Ticket.svg). */
export const SCRATCH_TICKET_VIEWBOX = {
  width: 805.73,
  height: 1274.34,
} as const

/** Scratch panel on the ticket art. */
export const SCRATCH_ZONE_VIEWBOX = {
  x: 25.87,
  y: 24.87,
  width: 754,
  height: 722,
} as const

export const SCRATCH_ZONE_ASPECT =
  SCRATCH_ZONE_VIEWBOX.width / SCRATCH_ZONE_VIEWBOX.height

/** Ticket height as a fraction of Verdant glyph stage (see kelvin chapter CSS). */
export const SCRATCH_TICKET_VERDANT_HEIGHT_SCALE = 0.85

/** Fallback width when layout has not measured (480px verdant cap × scale). */
export const SCRATCH_TICKET_DISPLAY_MAX_PX = Math.round(
  480 *
    SCRATCH_TICKET_VERDANT_HEIGHT_SCALE *
    (SCRATCH_TICKET_VIEWBOX.width / SCRATCH_TICKET_VIEWBOX.height),
)

/** Layout percents for positioning the scratch surface on the ticket frame. */
export function scratchZoneLayoutPercents() {
  return {
    left: (SCRATCH_ZONE_VIEWBOX.x / SCRATCH_TICKET_VIEWBOX.width) * 100,
    top: (SCRATCH_ZONE_VIEWBOX.y / SCRATCH_TICKET_VIEWBOX.height) * 100,
    width: (SCRATCH_ZONE_VIEWBOX.width / SCRATCH_TICKET_VIEWBOX.width) * 100,
    height: (SCRATCH_ZONE_VIEWBOX.height / SCRATCH_TICKET_VIEWBOX.height) * 100,
    aspect: SCRATCH_ZONE_ASPECT,
  }
}

/** Cursor + tray coin — scales with ticket/tray width. */
export function coinDisplayPxFromTicketWidth(ticketWidthPx: number) {
  return Math.round(Math.min(100, Math.max(52, ticketWidthPx * 0.22)))
}

/** @deprecated Use coinDisplayPxFromTicketWidth */
export function coinDisplayPxFromTrayWidth(trayWidthPx: number) {
  return coinDisplayPxFromTicketWidth(trayWidthPx)
}

/** Scratch zone size in CSS px from the rendered ticket dimensions. */
export function scratchZonePixelSize(ticketWidth: number, ticketHeight: number) {
  return {
    width: Math.max(
      1,
      Math.round(
        ticketWidth *
          (SCRATCH_ZONE_VIEWBOX.width / SCRATCH_TICKET_VIEWBOX.width),
      ),
    ),
    height: Math.max(
      1,
      Math.round(
        ticketHeight *
          (SCRATCH_ZONE_VIEWBOX.height / SCRATCH_TICKET_VIEWBOX.height),
      ),
    ),
  }
}

/** When only ticket width is known (image still loading height). */
export function scratchZonePixelSizeFromTicketWidth(ticketWidth: number) {
  const ticketHeight =
    ticketWidth *
    (SCRATCH_TICKET_VIEWBOX.height / SCRATCH_TICKET_VIEWBOX.width)
  return scratchZonePixelSize(ticketWidth, ticketHeight)
}
