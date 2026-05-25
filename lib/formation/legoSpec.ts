/**
 * Formation LEGO — 10×10 stud plate, 2×4 bricks.
 * Art: user SVG exports in /Lego/ (see .cursor/rules/formation-lego.mdc).
 */

export const PLATE_STUDS = 10
export const BRICK_STUDS_LONG = 4
export const BRICK_STUDS_WIDE = 2

export type BrickOrient = 'h' | 'v'
export type BrickPivot = 'left' | 'right'
export type BrickColor = 'yellow' | 'cyan' | 'magenta' | 'black'

export const FORMATION_ASSET_BASE = '/Lego'

/** Native viewBox size from Figma SVG exports. */
export const FORMATION_ART = {
  board: { width: 1376.98, height: 805 },
  brick: { width: 412.23, height: 334 },
} as const

const COLOR_FILE: Record<BrickColor, string> = {
  yellow: 'Yellow',
  cyan: 'Cyan',
  magenta: 'Magenta',
  black: 'Black',
}

export function boardArtSrc(): string {
  return `${FORMATION_ASSET_BASE}/Lego_Board.svg`
}

export function brickArtSrc(color: BrickColor, pivot: BrickPivot): string {
  const side = pivot === 'left' ? 'Left' : 'Right'
  return `${FORMATION_ASSET_BASE}/Lego_${side}_${COLOR_FILE[color]}.svg`
}

export function brickFootprintStuds(orient: BrickOrient): {
  w: number
  h: number
} {
  return orient === 'h'
    ? { w: BRICK_STUDS_LONG, h: BRICK_STUDS_WIDE }
    : { w: BRICK_STUDS_WIDE, h: BRICK_STUDS_LONG }
}

export function footprintCells(
  gx: number,
  gy: number,
  orient: BrickOrient,
): { x: number; y: number }[] {
  const { w, h } = brickFootprintStuds(orient)
  const cells: { x: number; y: number }[] = []
  for (let dy = 0; dy < h; dy++) {
    for (let dx = 0; dx < w; dx++) {
      cells.push({ x: gx + dx, y: gy + dy })
    }
  }
  return cells
}

function cellKey(x: number, y: number): string {
  return `${x},${y}`
}

export function studTopHeights(
  pieces: { id: string; gx: number; gy: number; orient: BrickOrient; level: number }[],
  excludeId?: string,
): Map<string, number> {
  const heights = new Map<string, number>()
  for (const p of [...pieces].sort((a, b) => a.level - b.level)) {
    if (p.id === excludeId) continue
    for (const { x, y } of footprintCells(p.gx, p.gy, p.orient)) {
      heights.set(cellKey(x, y), p.level + 1)
    }
  }
  return heights
}

export function snapToTopLevel(
  gx: number,
  gy: number,
  orient: BrickOrient,
  pieces: { id: string; gx: number; gy: number; orient: BrickOrient; level: number }[],
  excludeId?: string,
): number {
  const heights = studTopHeights(pieces, excludeId)
  let level = 0
  for (const { x, y } of footprintCells(gx, gy, orient)) {
    level = Math.max(level, heights.get(cellKey(x, y)) ?? 0)
  }
  return level
}

export function clampStudPosition(
  gx: number,
  gy: number,
  orient: BrickOrient,
): { gx: number; gy: number } {
  const { w, h } = brickFootprintStuds(orient)
  return {
    gx: Math.max(0, Math.min(PLATE_STUDS - w, gx)),
    gy: Math.max(0, Math.min(PLATE_STUDS - h, gy)),
  }
}

export function drawOrderKey(
  gx: number,
  gy: number,
  level: number,
  orient: BrickOrient,
): number {
  const { w, h } = brickFootprintStuds(orient)
  return level * 1000 + gx + gy + w + h
}

export function formationScale(boardDisplayW: number): number {
  return boardDisplayW / FORMATION_ART.board.width
}

export function boardDisplayHeight(boardDisplayW: number): number {
  return FORMATION_ART.board.height * formationScale(boardDisplayW)
}

export function brickDisplaySize(boardDisplayW: number): {
  width: number
  height: number
} {
  const s = formationScale(boardDisplayW)
  return {
    width: FORMATION_ART.brick.width * s,
    height: FORMATION_ART.brick.height * s,
  }
}

/** Calibrated from PNG placement, scaled to SVG viewBox proportions. */
const PLATE_ORIGIN = {
  x: 28 * (FORMATION_ART.board.width / 257),
  y: 42 * (FORMATION_ART.board.height / 150),
}
const PLATE_STEP = {
  x: 8.15 * (FORMATION_ART.board.width / 257),
  y: 3.75 * (FORMATION_ART.board.height / 150),
}

const BRICK_ANCHOR: Record<BrickPivot, { x: number; y: number }> = {
  left: {
    x: 20 * (FORMATION_ART.brick.width / 185),
    y: 128 * (FORMATION_ART.brick.height / 150),
  },
  right: {
    x: 165 * (FORMATION_ART.brick.width / 185),
    y: 128 * (FORMATION_ART.brick.height / 150),
  },
}

function studToNative(sx: number, sy: number): { x: number; y: number } {
  return {
    x: PLATE_ORIGIN.x + (sx - sy) * PLATE_STEP.x,
    y: PLATE_ORIGIN.y + (sx + sy) * PLATE_STEP.y,
  }
}

export function brickPlacement(
  boardDisplayW: number,
  gx: number,
  gy: number,
  pivot: BrickPivot,
  level: number,
  layerLift: number,
): { left: number; top: number; width: number; height: number } {
  const s = formationScale(boardDisplayW)
  const stud = studToNative(gx, gy)
  const anchor = BRICK_ANCHOR[pivot]
  const size = brickDisplaySize(boardDisplayW)
  return {
    left: (stud.x - anchor.x) * s,
    top: (stud.y - anchor.y) * s - level * layerLift,
    width: size.width,
    height: size.height,
  }
}

export function nativeFromAnchor(
  localLeft: number,
  localTop: number,
  boardDisplayW: number,
  pivot: BrickPivot,
  level: number,
  layerLift: number,
): { x: number; y: number } {
  const s = formationScale(boardDisplayW)
  const anchor = BRICK_ANCHOR[pivot]
  return {
    x: localLeft / s + anchor.x,
    y: (localTop + level * layerLift) / s + anchor.y,
  }
}

export function nativeToStud(nativeX: number, nativeY: number): {
  gx: number
  gy: number
} {
  const dx = nativeX - PLATE_ORIGIN.x
  const dy = nativeY - PLATE_ORIGIN.y
  return {
    gx: Math.round((dx / PLATE_STEP.x + dy / PLATE_STEP.y) / 2),
    gy: Math.round((dy / PLATE_STEP.y - dx / PLATE_STEP.x) / 2),
  }
}
