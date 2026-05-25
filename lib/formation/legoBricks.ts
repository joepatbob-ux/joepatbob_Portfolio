/**
 * 2×4 bricks on the Formation peg grid (see legoGrid.ts).
 *
 * **Position pin** (red in reference art) snaps to the clicked plate peg.
 * **Block 0,0** sits BLOCK_ORIGIN_ABOVE_POSITION_GY studs along +GY (up-screen).
 * Right: 4×2 along +GX. Left: 4×2 along +GY.
 */

import {
  boardScale,
  BOARD_VIEWBOX,
  GRID_STEP,
  nearestStudFromNative,
  PLATE_STUDS,
  studToNative,
} from '@/lib/formation/legoGrid'

export const BRICK_VIEWBOX = { width: 412.23, height: 334 } as const

export const BRICK_STUDS_LONG = 4
export const BRICK_STUDS_WIDE = 2

/** Block logical origin is this many plate studs (+GY) above the position pin. */
export const BLOCK_ORIGIN_ABOVE_POSITION_GY = 3.566

export type BrickColor = 'yellow' | 'cyan' | 'magenta' | 'black'
export type BrickPivot = 'left' | 'right'
export type BrickLongAxis = 'gx' | 'gy'

const COLOR_FILE: Record<BrickColor, string> = {
  yellow: 'Yellow',
  cyan: 'Cyan',
  magenta: 'Magenta',
  black: 'Black',
}

type PivotLayout = {
  /** Position pin (placement anchor) in brick SVG space. */
  positionPinNative: { x: number; y: number }
  pivotLocal: { lx: number; ly: number }
  longAlong: BrickLongAxis
}

/** Tuned from stud centers vs plate +GX / +GY step vectors. */
export const PIVOT_LAYOUT: Record<BrickPivot, PivotLayout> = {
  left: {
    positionPinNative: { x: 254.61, y: 193 },
    pivotLocal: { lx: 0, ly: 0 },
    longAlong: 'gy',
  },
  right: {
    positionPinNative: { x: 157.62, y: 193 },
    pivotLocal: { lx: 0, ly: 0 },
    longAlong: 'gx',
  },
}

export function pivotLayout(pivot: BrickPivot): PivotLayout {
  return PIVOT_LAYOUT[pivot]
}

/** Position pin in SVG — aligns to the plate peg the user picks. */
export const BRICK_POSITION_PIN_NATIVE: Record<
  BrickPivot,
  { x: number; y: number }
> = {
  left: PIVOT_LAYOUT.left.positionPinNative,
  right: PIVOT_LAYOUT.right.positionPinNative,
}

/** Block 0,0 in brick SVG (above position pin along plate +GY). */
export function blockOriginNativeInBrick(pivot: BrickPivot): {
  x: number
  y: number
} {
  const pin = BRICK_POSITION_PIN_NATIVE[pivot]
  return {
    x: pin.x - BLOCK_ORIGIN_ABOVE_POSITION_GY * GRID_STEP.x,
    y: pin.y + BLOCK_ORIGIN_ABOVE_POSITION_GY * GRID_STEP.y,
  }
}

export function brickArtSrc(color: BrickColor, pivot: BrickPivot): string {
  const side = pivot === 'left' ? 'Left' : 'Right'
  return `/Lego/Lego_${side}_${COLOR_FILE[color]}.svg`
}

/** Block 0,0 on the plate in native board coords. */
export function blockOriginNativeFromPosition(
  positionGx: number,
  positionGy: number,
): { x: number; y: number } {
  const pos = studToNative(positionGx, positionGy)
  return {
    x: pos.x - BLOCK_ORIGIN_ABOVE_POSITION_GY * GRID_STEP.x,
    y: pos.y + BLOCK_ORIGIN_ABOVE_POSITION_GY * GRID_STEP.y,
  }
}

function footprintLocalOffsets(pivot: BrickPivot): { lx: number; ly: number }[] {
  const { longAlong } = PIVOT_LAYOUT[pivot]
  const offsets: { lx: number; ly: number }[] = []
  if (longAlong === 'gx') {
    for (let dy = 0; dy < BRICK_STUDS_WIDE; dy++) {
      for (let dx = 0; dx < BRICK_STUDS_LONG; dx++) {
        offsets.push({ lx: dx, ly: dy })
      }
    }
  } else {
    for (let dy = 0; dy < BRICK_STUDS_LONG; dy++) {
      for (let dx = 0; dx < BRICK_STUDS_WIDE; dx++) {
        offsets.push({ lx: dx, ly: dy })
      }
    }
  }
  return offsets
}

/** Eight plate pegs under the brick from block 0,0 (not the position pin). */
export function footprintCells(
  positionGx: number,
  positionGy: number,
  pivot: BrickPivot,
): { x: number; y: number }[] {
  const { pivotLocal } = PIVOT_LAYOUT[pivot]
  const origin = blockOriginNativeFromPosition(positionGx, positionGy)
  return footprintLocalOffsets(pivot).map(({ lx, ly }) => {
    const native = {
      x: origin.x + (lx - ly + pivotLocal.lx) * GRID_STEP.x,
      y: origin.y + (lx + ly + pivotLocal.ly) * GRID_STEP.y,
    }
    const peg = nearestStudFromNative(native.x, native.y)
    return { x: peg.gx, y: peg.gy }
  })
}

function cellKey(x: number, y: number): string {
  return `${x},${y}`
}

export function clampBrickAnchor(
  positionGx: number,
  positionGy: number,
  pivot: BrickPivot,
): { gx: number; gy: number } {
  let gx = Math.max(0, Math.min(PLATE_STUDS - 1, positionGx))
  let gy = Math.max(0, Math.min(PLATE_STUDS - 1, positionGy))

  const fits = (pgx: number, pgy: number) => {
    const cells = footprintCells(pgx, pgy, pivot)
    return cells.every(
      (c) => c.x >= 0 && c.x < PLATE_STUDS && c.y >= 0 && c.y < PLATE_STUDS,
    )
  }

  if (fits(gx, gy)) return { gx, gy }

  let best = { gx, gy }
  let bestD = Infinity
  for (let py = 0; py < PLATE_STUDS; py++) {
    for (let px = 0; px < PLATE_STUDS; px++) {
      if (!fits(px, py)) continue
      const d =
        (px - positionGx) * (px - positionGx) + (py - positionGy) * (py - positionGy)
      if (d < bestD) {
        bestD = d
        best = { gx: px, gy: py }
      }
    }
  }
  return best
}

export function studTopHeights(
  pieces: {
    id: string
    gx: number
    gy: number
    pivot: BrickPivot
    level: number
  }[],
  excludeId?: string,
): Map<string, number> {
  const heights = new Map<string, number>()
  for (const p of [...pieces].sort((a, b) => a.level - b.level)) {
    if (p.id === excludeId) continue
    for (const { x, y } of footprintCells(p.gx, p.gy, p.pivot)) {
      heights.set(cellKey(x, y), p.level + 1)
    }
  }
  return heights
}

export function snapToTopLevel(
  gx: number,
  gy: number,
  pivot: BrickPivot,
  pieces: {
    id: string
    gx: number
    gy: number
    pivot: BrickPivot
    level: number
  }[],
  excludeId?: string,
): number {
  const heights = studTopHeights(pieces, excludeId)
  let level = 0
  for (const { x, y } of footprintCells(gx, gy, pivot)) {
    level = Math.max(level, heights.get(cellKey(x, y)) ?? 0)
  }
  return level
}

export function drawOrderKey(
  gx: number,
  gy: number,
  level: number,
  pivot: BrickPivot,
): number {
  const cells = footprintCells(gx, gy, pivot)
  const maxSum = Math.max(...cells.map((c) => c.x + c.y))
  return level * 1000 + maxSum
}

/** Flip swaps Left/Right art and mirrors position peg GX across the plate. */
export function flipMirror(
  gx: number,
  gy: number,
  pivot: BrickPivot,
): { gx: number; gy: number; pivot: BrickPivot } {
  return {
    gx: PLATE_STUDS - 1 - gx,
    gy,
    pivot: pivot === 'left' ? 'right' : 'left',
  }
}

export function brickDisplaySize(displayWidth: number): {
  width: number
  height: number
} {
  const s = boardScale(displayWidth)
  return {
    width: BRICK_VIEWBOX.width * s,
    height: BRICK_VIEWBOX.height * s,
  }
}

/** Align position pin in art to the plate peg (gx, gy). */
export function brickPlacement(
  displayWidth: number,
  positionGx: number,
  positionGy: number,
  pivot: BrickPivot,
  level: number,
  layerLift: number,
): { left: number; top: number; width: number; height: number } {
  const s = boardScale(displayWidth)
  const stud = studToNative(positionGx, positionGy)
  const anchor = BRICK_POSITION_PIN_NATIVE[pivot]
  const size = brickDisplaySize(displayWidth)
  return {
    left: (stud.x - anchor.x) * s,
    top: (stud.y - anchor.y) * s - level * layerLift,
    width: size.width,
    height: size.height,
  }
}

type PegCoord = { gx: number; gy: number }

/** Position pin in board native coords from brick box top-left. */
export function positionPinNative(
  localLeft: number,
  localTop: number,
  displayWidth: number,
  pivot: BrickPivot,
  level: number,
  layerLift: number,
): { x: number; y: number } {
  const s = boardScale(displayWidth)
  const anchor = BRICK_POSITION_PIN_NATIVE[pivot]
  return {
    x: localLeft / s + anchor.x,
    y: localTop / s + anchor.y + (level * layerLift) / s,
  }
}

export function anchorFromPlacement(
  localLeft: number,
  localTop: number,
  displayWidth: number,
  pivot: BrickPivot,
  level: number,
  layerLift: number,
): PegCoord {
  const native = positionPinNative(
    localLeft,
    localTop,
    displayWidth,
    pivot,
    level,
    layerLift,
  )
  return nearestStudFromNative(native.x, native.y)
}

export function blockOriginScreenPosition(
  positionGx: number,
  positionGy: number,
  displayWidth: number,
): { left: number; top: number } {
  const s = boardScale(displayWidth)
  const { x, y } = blockOriginNativeFromPosition(positionGx, positionGy)
  return { left: x * s, top: y * s }
}

export function boardDisplayHeight(displayWidth: number): number {
  return BOARD_VIEWBOX.height * boardScale(displayWidth)
}
