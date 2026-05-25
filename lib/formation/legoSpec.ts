/**
 * LEGO 2×4 + 16×16 plate — mm from technical drawing.
 * Board and brick authored art share one scale (native pixels × display scale).
 */

export const LEGO_MM = {
  studPitch: 8,
  studDiameter: 4.8,
  studHeight: 1.8,
  wallThickness: 1.2,
  brick2x4: {
    studsLong: 4,
    studsWide: 2,
    plateLength: 31.8,
    plateWidth: 15.8,
    bodyHeight: 9.6,
    edgeInset: 3.9,
  },
  plate16: {
    studs: 16,
  },
} as const

export const FORMATION_ART = {
  board: { width: 215, height: 150 },
  brick: { width: 182, height: 150 },
} as const

export type BrickColor = 'yellow' | 'cyan' | 'magenta' | 'black'
export type BrickPivot = 'left' | 'right'

/** One scale factor: board display width ÷ authored board width. */
export function formationArtScale(displayBoardWidth: number): number {
  return displayBoardWidth / FORMATION_ART.board.width
}

export function boardDisplayHeight(displayBoardWidth: number): number {
  const s = formationArtScale(displayBoardWidth)
  return FORMATION_ART.board.height * s
}

export function brickDisplaySize(displayBoardWidth: number): {
  width: number
  height: number
} {
  const s = formationArtScale(displayBoardWidth)
  return {
    width: FORMATION_ART.brick.width * s,
    height: FORMATION_ART.brick.height * s,
  }
}

export function brickArtSrc(color: BrickColor, pivot: BrickPivot): string {
  return `/images/formation/brick-${pivot}-${color}.png`
}
