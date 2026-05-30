// Frame layout in design pixels (240×147). Copy x/y/w/h from Figma with the 240×147 frame selected.

export const FRAME_WIDTH = 240
export const FRAME_HEIGHT = 147

export type FrameRect = { x: number; y: number; w: number; h: number }

/** Convert Figma inset (top, right, bottom, left %) to a rect on the 240×147 frame */
function frameInsetRect(top: number, right: number, bottom: number, left: number): FrameRect {
  const w = ((100 - left - right) / 100) * FRAME_WIDTH
  const h = ((100 - top - bottom) / 100) * FRAME_HEIGHT
  const x = (left / 100) * FRAME_WIDTH
  const y = (top / 100) * FRAME_HEIGHT
  return {
    x: Math.round(x * 100) / 100,
    y: Math.round(y * 100) / 100,
    w: Math.round(w * 100) / 100,
    h: Math.round(h * 100) / 100,
  }
}

/** Sensi wordmark — matches lite-type.svg export (45×23) on the bezel */
export const FRAME_LOGO = frameInsetRect(5.44, 40.44, 79.32, 40.89)
