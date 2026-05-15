// Shared 7-segment digit map + layout grid (design pixels).
import type { CSSProperties } from 'react'

export const SEG_PARTS = ['top', 'mid', 'bot', 'tl', 'tr', 'bl', 'br'] as const
export type SegPart = (typeof SEG_PARTS)[number]

/** Each digit → [top, mid, bot, tl, tr, bl, br] segment on/off */
export const SEGS: Record<number, number[]> = {
  0: [1, 0, 1, 1, 1, 1, 1],
  1: [0, 0, 0, 0, 1, 0, 1],
  2: [1, 1, 1, 0, 1, 1, 0],
  3: [1, 1, 1, 0, 1, 0, 1],
  4: [0, 1, 0, 1, 1, 0, 1],
  5: [1, 1, 1, 1, 0, 0, 1],
  6: [1, 1, 1, 1, 0, 1, 1],
  7: [1, 0, 0, 0, 1, 0, 1],
  8: [1, 1, 1, 1, 1, 1, 1],
  9: [1, 1, 1, 1, 1, 0, 1],
}

/** Layout positions on the 28×52 px prototype grid (matches SegmentDisplay Digit). */
export const LCD_SEGMENT_LAYOUT: Record<SegPart, CSSProperties> = {
  top: { top: 1, left: 4, right: 4, height: 3 },
  mid: { top: '50%', left: 2, right: 2, height: 3, marginTop: -1.5 },
  bot: { bottom: 1, left: 4, right: 4, height: 3 },
  tl: { top: 4, left: 2, width: 3, bottom: 'calc(50% + 3px)' },
  tr: { top: 4, right: 2, width: 3, bottom: 'calc(50% + 3px)' },
  bl: { bottom: 4, left: 2, width: 3, top: 'calc(50% + 3px)' },
  br: { bottom: 4, right: 2, width: 3, top: 'calc(50% + 3px)' },
}
