/** Stable layer ids for layout debug (?kelvin-ghost=1) and issue reports. */
export const KELVIN_LAYER = {
  root: 'kelvin-root',
  stage: 'kelvin-stage',
  column: 'kelvin-column',
  ticketStack: 'kelvin-ticket-stack',
  ticketFrame: 'kelvin-ticket-frame',
  scratchPanel: 'kelvin-scratch-panel',
  scratchZone: 'kelvin-scratch-zone',
  tray: 'kelvin-tray',
  trayBar: 'kelvin-tray-bar',
  coinCursor: 'kelvin-coin-cursor',
} as const

export type KelvinLayerId = (typeof KELVIN_LAYER)[keyof typeof KELVIN_LAYER]
