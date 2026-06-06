import { LAYOUT_BP } from '@/lib/layout/breakpoints'

/** Max z-index for chapter panels on phone — stay below stickers (50+) and nav chrome (120). */
export const MOBILE_PANEL_Z_MAX = 8
export const MOBILE_PANEL_Z_ENTERING = 9

export function isLayoutMobileWidth(width: number): boolean {
  return width <= LAYOUT_BP.mobileMax
}

export function panelZFromScrollReveal(reveal: number, mobile: boolean): number {
  if (reveal <= 0.08) return 0
  if (mobile) {
    return Math.min(MOBILE_PANEL_Z_MAX, Math.round(1 + reveal * MOBILE_PANEL_Z_MAX))
  }
  return Math.round(10 + reveal * 90)
}

export type StickerZIndices = {
  base: number
  pile: number
  drag: number
  /** Selected placed sticker — above formation board portal. */
  selected: number
}

/** Inline sticker / pile portal z-index — keep in sync with `--z-stickers` in globals.css. */
export function stickerZIndices(mobile: boolean): StickerZIndices {
  return mobile
    ? { base: 52, pile: 50, drag: 130, selected: 95 }
    : { base: 116, pile: 115, drag: 220, selected: 125 }
}
