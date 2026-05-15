// LCD layout in design pixels (75×75). Copy x/y/w/h from Figma with the LCD frame selected.
// In Figma: select icon → Inspect → copy X, Y, W, H relative to the 75×75 LCD frame.

export const LCD_SIZE = 75

export type LcdRect = { x: number; y: number; w: number; h: number }

/** Convert Figma inset (top, right, bottom, left %) to a rect on the 75×75 LCD */
function insetRect(top: number, right: number, bottom: number, left: number): LcdRect {
  const w = ((100 - left - right) / 100) * LCD_SIZE
  const h = ((100 - top - bottom) / 100) * LCD_SIZE
  const x = (left / 100) * LCD_SIZE
  const y = (top / 100) * LCD_SIZE
  return { x: Math.round(x * 100) / 100, y: Math.round(y * 100) / 100, w: Math.round(w * 100) / 100, h: Math.round(h * 100) / 100 }
}

export const LCD_ICONS = {
  setTo: insetRect(10.67, 36, 83.33, 37.33),
  cool: insetRect(32.68, 2.29, 55.75, 87.47),
  heat: insetRect(46.62, 3.24, 41.76, 88.27),
  off: insetRect(67.68, 1.51, 25.77, 86.93),
  on: insetRect(76, 2.67, 19.2, 87.73),
} as const satisfies Record<string, LcdRect>

export const LCD_DIGITS = {
  tens: { x: 12, y: 14, w: 25, h: 47 },
  ones: { x: 39, y: 14, w: 25, h: 47 },
} as const satisfies Record<string, LcdRect>
