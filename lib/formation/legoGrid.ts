/**
 * 10×10 stud grid for Formation LEGO board.
 *
 * Coordinates (from your spec):
 * - Origin (0,0): bottom tip stud on Lego_Board.svg (A0).
 * - +GX (x-axis, 0–9): toward screen right (upper-right on the plate).
 * - +GY (y-axis, A–J): from cyan corner (A) up the plate to magenta corner (J).
 *
 * Pin labels: `pegLabel(gx, gy)` → letter from gy + digit from gx (e.g. A0, J9).
 *
 * Screen position in board viewBox units:
 *   x = ORIGIN.x + (gx - gy) * STEP_X
 *   y = ORIGIN.y + (gx + gy) * STEP_Y
 */

export const PLATE_STUDS = 10
export const BOARD_VIEWBOX = { width: 1376.98, height: 805 } as const

/** Bottom tip stud (zero pin) in board SVG space. */
export const GRID_ORIGIN = { x: 667.71, y: 750 } as const

/** Isometric stud pitch from Lego_Board.svg cls-3 centers. */
export const GRID_STEP = { x: 68.99, y: -39.84 } as const

export type PegCoord = { gx: number; gy: number }

export type PegPosition = PegCoord & { x: number; y: number }

/** Y-axis letters A–J (cyan → magenta along +GY). */
export const PEG_Y_LETTERS = 'ABCDEFGHIJ'

/** @deprecated Use PEG_Y_LETTERS — kept for imports that expected GX_LETTERS. */
export const GX_LETTERS = PEG_Y_LETTERS

/** Y-axis letter for a peg row (A at gy=0, J at gy=9). */
export function pegYLetter(gy: number): string {
  return PEG_Y_LETTERS[gy] ?? '?'
}

/** Reference label for a cell, e.g. `A0`, `D4` (y letter + x digit). */
export function pegLabel(gx: number, gy: number): string {
  return `${pegYLetter(gy)}${gx}`
}

/** Human + internal coords for debug (x digit, y letter). */
export function pegCoordAnnotation(gx: number, gy: number): string {
  return `x=${gx} y=${pegYLetter(gy)} (gx=${gx}, gy=${gy})`
}

export function studToNative(gx: number, gy: number): { x: number; y: number } {
  return {
    x: GRID_ORIGIN.x + (gx - gy) * GRID_STEP.x,
    y: GRID_ORIGIN.y + (gx + gy) * GRID_STEP.y,
  }
}

/** Snap pointer position to the closest authored stud center. */
export function nearestStudFromNative(x: number, y: number): PegCoord {
  let best = PEG_MAP[0]
  let bestD = Infinity
  for (const peg of PEG_MAP) {
    const dx = peg.x - x
    const dy = peg.y - y
    const d = dx * dx + dy * dy
    if (d < bestD) {
      bestD = d
      best = peg
    }
  }
  return { gx: best.gx, gy: best.gy }
}

export function boardScale(displayWidth: number): number {
  return displayWidth / BOARD_VIEWBOX.width
}

/** Inset around outermost stud centers (excludes Lego_Board.svg bezel). */
const PLATE_STUD_INSET = 42

export type PlateContentBounds = {
  minX: number
  minY: number
  width: number
  height: number
}

export function pegScreenPosition(
  gx: number,
  gy: number,
  displayWidth: number,
): { left: number; top: number } {
  const s = boardScale(displayWidth)
  const { x, y } = studToNative(gx, gy)
  return { left: x * s, top: y * s }
}

/** All 100 stud centers parsed from Lego_Board.svg (cls-3 path origins). */
export const PEG_MAP: PegPosition[] = [
  { gx: 0, gy: 0, x: 667.71, y: 750 },
  { gx: 1, gy: 0, x: 736.7, y: 710.16 },
  { gx: 2, gy: 0, x: 805.69, y: 670.33 },
  { gx: 3, gy: 0, x: 874.68, y: 630.5 },
  { gx: 4, gy: 0, x: 943.68, y: 590.67 },
  { gx: 5, gy: 0, x: 1012.67, y: 550.83 },
  { gx: 6, gy: 0, x: 1081.66, y: 511 },
  { gx: 7, gy: 0, x: 1150.66, y: 471.17 },
  { gx: 8, gy: 0, x: 1219.65, y: 431.33 },
  { gx: 9, gy: 0, x: 1288.64, y: 391.5 },
  { gx: 0, gy: 1, x: 598.71, y: 710.16 },
  { gx: 1, gy: 1, x: 667.71, y: 670.33 },
  { gx: 2, gy: 1, x: 736.7, y: 630.5 },
  { gx: 3, gy: 1, x: 805.69, y: 590.67 },
  { gx: 4, gy: 1, x: 874.68, y: 550.83 },
  { gx: 5, gy: 1, x: 943.68, y: 511 },
  { gx: 6, gy: 1, x: 1012.67, y: 471.17 },
  { gx: 7, gy: 1, x: 1081.66, y: 431.33 },
  { gx: 8, gy: 1, x: 1150.66, y: 391.5 },
  { gx: 9, gy: 1, x: 1219.65, y: 351.67 },
  { gx: 0, gy: 2, x: 529.72, y: 670.33 },
  { gx: 1, gy: 2, x: 598.71, y: 630.5 },
  { gx: 2, gy: 2, x: 667.71, y: 590.66 },
  { gx: 3, gy: 2, x: 736.7, y: 550.83 },
  { gx: 4, gy: 2, x: 805.69, y: 510.67 },
  { gx: 5, gy: 2, x: 874.68, y: 471.17 },
  { gx: 6, gy: 2, x: 943.68, y: 431.33 },
  { gx: 7, gy: 2, x: 1012.67, y: 391.5 },
  { gx: 8, gy: 2, x: 1081.66, y: 351.67 },
  { gx: 9, gy: 2, x: 1150.66, y: 311.83 },
  { gx: 0, gy: 3, x: 460.72, y: 630.5 },
  { gx: 1, gy: 3, x: 529.72, y: 590.66 },
  { gx: 2, gy: 3, x: 598.71, y: 550.83 },
  { gx: 3, gy: 3, x: 667.71, y: 511 },
  { gx: 4, gy: 3, x: 736.7, y: 471.17 },
  { gx: 5, gy: 3, x: 805.69, y: 431.33 },
  { gx: 6, gy: 3, x: 874.68, y: 391.5 },
  { gx: 7, gy: 3, x: 943.68, y: 351.67 },
  { gx: 8, gy: 3, x: 1012.67, y: 311.83 },
  { gx: 9, gy: 3, x: 1081.66, y: 272 },
  { gx: 0, gy: 4, x: 391.73, y: 590.66 },
  { gx: 1, gy: 4, x: 460.72, y: 550.83 },
  { gx: 2, gy: 4, x: 529.72, y: 511 },
  { gx: 3, gy: 4, x: 598.71, y: 471.17 },
  { gx: 4, gy: 4, x: 667.71, y: 431.33 },
  { gx: 5, gy: 4, x: 736.7, y: 391.5 },
  { gx: 6, gy: 4, x: 805.69, y: 351.67 },
  { gx: 7, gy: 4, x: 874.68, y: 311.83 },
  { gx: 8, gy: 4, x: 943.68, y: 272 },
  { gx: 9, gy: 4, x: 1012.67, y: 232.17 },
  { gx: 0, gy: 5, x: 322.74, y: 550.83 },
  { gx: 1, gy: 5, x: 391.73, y: 511 },
  { gx: 2, gy: 5, x: 460.72, y: 471.17 },
  { gx: 3, gy: 5, x: 529.72, y: 431.33 },
  { gx: 4, gy: 5, x: 598.71, y: 391.5 },
  { gx: 5, gy: 5, x: 667.71, y: 351.67 },
  { gx: 6, gy: 5, x: 736.7, y: 311.83 },
  { gx: 7, gy: 5, x: 805.69, y: 272 },
  { gx: 8, gy: 5, x: 874.68, y: 232.17 },
  { gx: 9, gy: 5, x: 943.68, y: 192.33 },
  { gx: 0, gy: 6, x: 253.74, y: 511 },
  { gx: 1, gy: 6, x: 322.74, y: 471.17 },
  { gx: 2, gy: 6, x: 391.73, y: 431.33 },
  { gx: 3, gy: 6, x: 460.72, y: 391.5 },
  { gx: 4, gy: 6, x: 529.72, y: 351.67 },
  { gx: 5, gy: 6, x: 598.71, y: 311.83 },
  { gx: 6, gy: 6, x: 667.71, y: 272 },
  { gx: 7, gy: 6, x: 736.7, y: 232.17 },
  { gx: 8, gy: 6, x: 805.69, y: 192.33 },
  { gx: 9, gy: 6, x: 874.68, y: 152.5 },
  { gx: 0, gy: 7, x: 184.75, y: 471.17 },
  { gx: 1, gy: 7, x: 253.74, y: 431.33 },
  { gx: 2, gy: 7, x: 322.74, y: 391.5 },
  { gx: 3, gy: 7, x: 391.73, y: 351.67 },
  { gx: 4, gy: 7, x: 460.72, y: 311.83 },
  { gx: 5, gy: 7, x: 529.72, y: 272 },
  { gx: 6, gy: 7, x: 598.71, y: 232.17 },
  { gx: 7, gy: 7, x: 667.71, y: 192.33 },
  { gx: 8, gy: 7, x: 736.7, y: 152.5 },
  { gx: 9, gy: 7, x: 805.69, y: 112.67 },
  { gx: 0, gy: 8, x: 115.76, y: 431.33 },
  { gx: 1, gy: 8, x: 184.75, y: 391.5 },
  { gx: 2, gy: 8, x: 253.74, y: 351.67 },
  { gx: 3, gy: 8, x: 322.74, y: 311.83 },
  { gx: 4, gy: 8, x: 391.73, y: 272 },
  { gx: 5, gy: 8, x: 460.72, y: 232.17 },
  { gx: 6, gy: 8, x: 529.72, y: 192.33 },
  { gx: 7, gy: 8, x: 598.71, y: 152.5 },
  { gx: 8, gy: 8, x: 667.71, y: 112.67 },
  { gx: 9, gy: 8, x: 736.7, y: 72.83 },
  { gx: 0, gy: 9, x: 46.77, y: 391.5 },
  { gx: 1, gy: 9, x: 115.76, y: 351.67 },
  { gx: 2, gy: 9, x: 184.75, y: 311.83 },
  { gx: 3, gy: 9, x: 253.74, y: 272 },
  { gx: 4, gy: 9, x: 322.74, y: 232.17 },
  { gx: 5, gy: 9, x: 391.73, y: 192.33 },
  { gx: 6, gy: 9, x: 460.72, y: 152.5 },
  { gx: 7, gy: 9, x: 529.72, y: 112.67 },
  { gx: 8, gy: 9, x: 598.71, y: 72.83 },
  { gx: 9, gy: 9, x: 667.71, y: 33 },
]

/** Playable 10×10 stud area in board SVG space (A0–J9 corners + stud radius). */
export const PLATE_CONTENT_BOUNDS: PlateContentBounds = (() => {
  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity
  for (const peg of PEG_MAP) {
    minX = Math.min(minX, peg.x)
    maxX = Math.max(maxX, peg.x)
    minY = Math.min(minY, peg.y)
    maxY = Math.max(maxY, peg.y)
  }
  return {
    minX: minX - PLATE_STUD_INSET,
    minY: minY - PLATE_STUD_INSET,
    width: maxX - minX + PLATE_STUD_INSET * 2,
    height: maxY - minY + PLATE_STUD_INSET * 2,
  }
})()
