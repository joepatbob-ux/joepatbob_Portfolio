export const DIGIT_SEGMENTS = ['top', 'mid', 'bot', 'tl', 'tr', 'bl', 'br'] as const
export type DigitSegment = (typeof DIGIT_SEGMENTS)[number]
export type DigitPosition = 'tens' | 'ones'

export const ICON_IDS = {
  auxHeat: 'icon-aux-heat',
  cool: 'icon-cool',
  disconnected: 'icon-disconnected',
  fan: 'icon-fan',
  lock: 'icon-lock',
  off: 'icon-off',
  onDegree: 'icon-on-degree',
  onText: 'icon-on-text',
  percent: 'icon-percent',
  service: 'icon-service',
  setTo: 'icon-set-to',
  wifi: 'icon-wifi',
} as const

export const LABEL_IDS = {
  aux: 'label-aux',
  battery: 'label-battery',
  outdoor: 'label-outdoor',
  savings: 'label-savings',
  service: 'label-service',
  setto: 'label-setto',
  setup: 'label-setup',
} as const

export type SegmentId = string

export function digitSegmentId(position: DigitPosition, seg: DigitSegment): SegmentId {
  return `digit-${position}-${seg}`
}
