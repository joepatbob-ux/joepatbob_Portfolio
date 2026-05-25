/**
 * 2×4 bricks on the Formation peg grid (see legoGrid.ts).
 *
 * **Left**: position-pin orange snaps to block-origin peg + visual nudge (not raw position peg).
 * **Right**: block **0,0** orange snaps to the plate peg under logical 0,0
 * (position pin −2, −2 on the grid → C2 puts block 0,0 on board A0).
 * **Block 0,0** sits BLOCK_ORIGIN_ABOVE_POSITION_GY studs along +GY (up-screen).
 * Right: 4×2 along +GX. Left: 4×2 along +GY.
 */

import {
  boardScale,
  BOARD_VIEWBOX,
  GRID_STEP,
  nearestStudFromNative,
  type PegCoord,
  PLATE_STUDS,
  studToNative,
} from '@/lib/formation/legoGrid'
import { spritePlacement } from '@/lib/formation/spritePlacement'

export const BRICK_VIEWBOX = { width: 412.23, height: 334 } as const

/** Align overlay art — plate pegs (orange) vs brick studs (gray). */
export const ALIGN_VIEWBOX = { width: 414.23, height: 334.58 } as const

/** Stud cap center (cls-2 path origin) in brick / align SVGs. */
export const POSITION_PIN_CENTER_NATIVE: Record<
  BrickPivot,
  { x: number; y: number }
> = {
  left: { x: 255.61, y: 193 },
  /** Brick cap center (Lego_Right_*.svg); align art is +1px — do not mirror left. */
  right: { x: 157.62, y: 193 },
}

/** Orange plate peg (align cls-1) paired with gray position-pin stud center. */
export const ALIGN_PLATE_ORANGE_PIN_NATIVE: Record<
  BrickPivot,
  { x: number; y: number }
> = {
  left: { x: 255.61, y: 209 },
  right: { x: 157.62, y: 209 },
}

/** Orange cap at block 0,0 in align overlay (0,0 label). */
export const ALIGN_BLOCK_ORIGIN_ORANGE_NATIVE: Record<
  BrickPivot,
  { x: number; y: number }
> = {
  left: { x: 255.61, y: 289 },
  right: { x: 157.62, y: 289 },
}

/**
 * Right pivot: block 0,0 plate peg is this many studs along +GX and +GY from
 * the position pin (tuned so C2 → block A0 covers board A0).
 */
const RIGHT_BLOCK_ORIGIN_OFFSET = { dgx: 2, dgy: 2 } as const

/** Tuned via Formation board drag + copy report (right pivot, position A0). */
const RIGHT_BLOCK_VISUAL_SNAP_NUDGE = {
  x: 40.7,
  y: -0.09,
} as const

/** Tuned via Formation board drag + copy report (left pivot, position C2). */
const LEFT_BLOCK_VISUAL_SNAP_NUDGE = {
  x: 276.95,
  y: 238.63,
} as const

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
    positionPinNative: POSITION_PIN_CENTER_NATIVE.left,
    pivotLocal: { lx: 0, ly: 0 },
    longAlong: 'gy',
  },
  right: {
    positionPinNative: POSITION_PIN_CENTER_NATIVE.right,
    pivotLocal: { lx: 0, ly: 0 },
    longAlong: 'gx',
  },
}

export function pivotLayout(pivot: BrickPivot): PivotLayout {
  return PIVOT_LAYOUT[pivot]
}

/** Stud cap center in brick SVG (logical peg / block-origin math). */
export const BRICK_POSITION_PIN_NATIVE: Record<
  BrickPivot,
  { x: number; y: number }
> = {
  left: PIVOT_LAYOUT.left.positionPinNative,
  right: PIVOT_LAYOUT.right.positionPinNative,
}

/** Grid peg under block logical 0,0 for this position pin (pivot-aware). */
export function blockOriginPegFromPosition(
  positionGx: number,
  positionGy: number,
  pivot: BrickPivot,
): PegCoord {
  if (pivot === 'right') {
    return {
      gx: Math.max(
        0,
        Math.min(PLATE_STUDS - 1, positionGx - RIGHT_BLOCK_ORIGIN_OFFSET.dgx),
      ),
      gy: Math.max(
        0,
        Math.min(PLATE_STUDS - 1, positionGy - RIGHT_BLOCK_ORIGIN_OFFSET.dgy),
      ),
    }
  }
  const pos = studToNative(positionGx, positionGy)
  const native = {
    x: pos.x - BLOCK_ORIGIN_ABOVE_POSITION_GY * GRID_STEP.x,
    y: pos.y + BLOCK_ORIGIN_ABOVE_POSITION_GY * GRID_STEP.y,
  }
  return nearestStudFromNative(native.x, native.y)
}

/** Board native point for block 0,0 snap (grid peg + optional visual nudge). */
export function blockOriginNativeFromPosition(
  positionGx: number,
  positionGy: number,
  pivot: BrickPivot,
): { x: number; y: number } {
  const peg = blockOriginPegFromPosition(positionGx, positionGy, pivot)
  const native = studToNative(peg.gx, peg.gy)
  if (pivot === 'right') {
    return {
      x: native.x + RIGHT_BLOCK_VISUAL_SNAP_NUDGE.x,
      y: native.y + RIGHT_BLOCK_VISUAL_SNAP_NUDGE.y,
    }
  }
  return {
    x: native.x + LEFT_BLOCK_VISUAL_SNAP_NUDGE.x,
    y: native.y + LEFT_BLOCK_VISUAL_SNAP_NUDGE.y,
  }
}

/** Snap anchor in overlay SVG ↔ board peg (left: position pin, right: block 0,0). */
export function placementSnapAnchor(pivot: BrickPivot): { x: number; y: number } {
  if (pivot === 'right') {
    return ALIGN_BLOCK_ORIGIN_ORANGE_NATIVE.right
  }
  return ALIGN_PLATE_ORANGE_PIN_NATIVE.left
}

/** Board peg center the overlay anchor should cover. */
export function placementBoardTarget(
  positionGx: number,
  positionGy: number,
  pivot: BrickPivot,
): { x: number; y: number } {
  return blockOriginNativeFromPosition(positionGx, positionGy, pivot)
}

/** Block 0,0 orange cap in overlay / brick space. */
export function blockOriginNativeInBrick(pivot: BrickPivot): {
  x: number
  y: number
} {
  return ALIGN_BLOCK_ORIGIN_ORANGE_NATIVE[pivot]
}

export function brickArtSrc(color: BrickColor, pivot: BrickPivot): string {
  const side = pivot === 'left' ? 'Left' : 'Right'
  return `/Lego/Lego_${side}_${COLOR_FILE[color]}.svg`
}

export function alignArtSrc(pivot: BrickPivot): string {
  const side = pivot === 'left' ? 'Left' : 'Right'
  return `/Lego/Lego_Align_${side}.svg`
}

export function alignPlacement(
  displayWidth: number,
  positionGx: number,
  positionGy: number,
  pivot: BrickPivot,
  level: number,
  layerLift: number,
) {
  return spritePlacement(
    displayWidth,
    placementSnapAnchor(pivot),
    placementBoardTarget(positionGx, positionGy, pivot),
    ALIGN_VIEWBOX,
    level,
    layerLift,
  )
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
  const originPeg = blockOriginPegFromPosition(positionGx, positionGy, pivot)
  const origin = studToNative(originPeg.gx, originPeg.gy)
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

export function brickPlacement(
  displayWidth: number,
  positionGx: number,
  positionGy: number,
  pivot: BrickPivot,
  level: number,
  layerLift: number,
) {
  return spritePlacement(
    displayWidth,
    placementSnapAnchor(pivot),
    placementBoardTarget(positionGx, positionGy, pivot),
    BRICK_VIEWBOX,
    level,
    layerLift,
  )
}

/** Nearest valid position pin after dragging the brick (includes visual nudge). */
export function positionPinFromBrickPlacement(
  localLeft: number,
  localTop: number,
  displayWidth: number,
  pivot: BrickPivot,
  level = 0,
  layerLift = 0,
): PegCoord {
  const s = boardScale(displayWidth)
  const anchor = placementSnapAnchor(pivot)
  const anchorBoard = {
    x: localLeft / s + anchor.x,
    y: localTop / s + anchor.y + (level * layerLift) / s,
  }

  let best = { gx: 0, gy: 0 }
  let bestD = Infinity
  for (let gy = 0; gy < PLATE_STUDS; gy++) {
    for (let gx = 0; gx < PLATE_STUDS; gx++) {
      const target = placementBoardTarget(gx, gy, pivot)
      const d =
        (target.x - anchorBoard.x) * (target.x - anchorBoard.x) +
        (target.y - anchorBoard.y) * (target.y - anchorBoard.y)
      if (d < bestD) {
        bestD = d
        best = { gx, gy }
      }
    }
  }
  return clampBrickAnchor(best.gx, best.gy, pivot)
}

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
  const anchor = placementSnapAnchor(pivot)
  return {
    x: localLeft / s + anchor.x,
    y: localTop / s + anchor.y + (level * layerLift) / s,
  }
}

export function blockOriginScreenPosition(
  positionGx: number,
  positionGy: number,
  displayWidth: number,
  pivot: BrickPivot,
): { left: number; top: number } {
  const s = boardScale(displayWidth)
  const { x, y } = blockOriginNativeFromPosition(positionGx, positionGy, pivot)
  return { left: x * s, top: y * s }
}

export function boardDisplayHeight(displayWidth: number): number {
  return BOARD_VIEWBOX.height * boardScale(displayWidth)
}
