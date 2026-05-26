/**
 * 2×4 bricks on the Formation peg grid (see legoGrid.ts).
 *
 * **Left**: position-pin orange snaps to the position-pin peg; block 0,0 uses the same peg
 *   (footprint uses block 0,0; move/snap uses position pin).
 * **Right**: block 0,0 orange snaps to block-origin peg (+nudge). Interior: pin − (2,2) → block;
 *   near plate corner (gx or gy under 2): block is pin + (1,1); else pin and block share a peg.
 * Left: 4×2 along +GY. Right: 4×2 along +GX.
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

type GridOffset = { dgx: number; dgy: number }

/** Right near plate corner: block 0,0 is +1 +GX, +1 +GY from the position pin (A0 → B1). */
const RIGHT_CORNER_PIN_TO_BLOCK: GridOffset = { dgx: -1, dgy: -1 }

/**
 * Left: block 0,0 peg coincides with the position pin peg.
 */
const LEFT_BLOCK_ORIGIN_OFFSET: GridOffset = { dgx: 0, dgy: 0 }

function clampPegCoord(gx: number, gy: number): PegCoord {
  return {
    gx: Math.max(0, Math.min(PLATE_STUDS - 1, gx)),
    gy: Math.max(0, Math.min(PLATE_STUDS - 1, gy)),
  }
}

function blockOriginPegFromPositionRight(
  positionGx: number,
  positionGy: number,
): PegCoord {
  if (positionGx < 2 || positionGy < 2) {
    const { dgx, dgy } = RIGHT_CORNER_PIN_TO_BLOCK
    return clampPegCoord(positionGx - dgx, positionGy - dgy)
  }
  return clampPegCoord(positionGx, positionGy)
}

function positionPinFromBlockOriginRight(
  blockGx: number,
  blockGy: number,
): PegCoord {
  if (blockGx < 2 || blockGy < 2) {
    const { dgx, dgy } = RIGHT_CORNER_PIN_TO_BLOCK
    return clampPegCoord(blockGx + dgx, blockGy + dgy)
  }
  return clampPegCoord(blockGx, blockGy)
}

function positionPinToBlockSeparationSq(
  positionGx: number,
  positionGy: number,
  pivot: BrickPivot,
): number {
  const block = blockOriginPegFromPosition(positionGx, positionGy, pivot)
  const dx = positionGx - block.gx
  const dy = positionGy - block.gy
  return dx * dx + dy * dy
}

/** Tuned via Formation board drag + copy report (right pivot). */
const RIGHT_BLOCK_VISUAL_SNAP_NUDGE = {
  x: 40.7,
  y: -0.09,
} as const

/** Sub-pixel tweak on position-pin peg snap (left pivot). */
const LEFT_POSITION_PIN_SNAP_NUDGE = { x: 0, y: 0 } as const

export const BRICK_STUDS_LONG = 4
export const BRICK_STUDS_WIDE = 2

/**
 * Legacy native-space offset (superseded by BLOCK_ORIGIN_OFFSET on the peg grid).
 * Kept for reference / debug comparisons.
 */
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
    return blockOriginPegFromPositionRight(positionGx, positionGy)
  }
  const { dgx, dgy } = LEFT_BLOCK_ORIGIN_OFFSET
  return clampPegCoord(positionGx - dgx, positionGy - dgy)
}

/** Inverse of blockOriginPegFromPosition — place block 0,0 on a plate peg. */
export function positionPinFromBlockOrigin(
  blockGx: number,
  blockGy: number,
  pivot: BrickPivot,
): PegCoord {
  if (pivot === 'right') {
    const peg = positionPinFromBlockOriginRight(blockGx, blockGy)
    return clampBrickAnchor(peg.gx, peg.gy, pivot)
  }
  const { dgx, dgy } = LEFT_BLOCK_ORIGIN_OFFSET
  return clampBrickAnchor(blockGx + dgx, blockGy + dgy, pivot)
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
  return { x: native.x, y: native.y }
}

function positionPinNativeFromPeg(
  positionGx: number,
  positionGy: number,
): { x: number; y: number } {
  const native = studToNative(positionGx, positionGy)
  return {
    x: native.x + LEFT_POSITION_PIN_SNAP_NUDGE.x,
    y: native.y + LEFT_POSITION_PIN_SNAP_NUDGE.y,
  }
}

/** Snap anchor in brick SVG (left: position pin, right: block 0,0). */
export function placementSnapAnchor(pivot: BrickPivot): { x: number; y: number } {
  if (pivot === 'left') {
    // The left-pivot snap anchor that aligns to studs is the block-origin orange cap.
    // Using the plate-pin orange cap here would land one stud lower/right.
    return ALIGN_BLOCK_ORIGIN_ORANGE_NATIVE.left
  }
  return ALIGN_BLOCK_ORIGIN_ORANGE_NATIVE.right
}

/** Board point the snap anchor should cover (matches click / drag release). */
export function placementBoardTarget(
  positionGx: number,
  positionGy: number,
  pivot: BrickPivot,
): { x: number; y: number } {
  if (pivot === 'left') {
    return positionPinNativeFromPeg(positionGx, positionGy)
  }
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

/** Eight plate pegs under the brick from a known block 0,0 peg (probe / visual). */
export function footprintCellsFromBlockOrigin(
  blockGx: number,
  blockGy: number,
  pivot: BrickPivot,
): { x: number; y: number }[] {
  const { pivotLocal } = PIVOT_LAYOUT[pivot]
  const origin = studToNative(blockGx, blockGy)
  return footprintLocalOffsets(pivot).map(({ lx, ly }) => {
    const native = {
      x: origin.x + (lx - ly + pivotLocal.lx) * GRID_STEP.x,
      y: origin.y + (lx + ly + pivotLocal.ly) * GRID_STEP.y,
    }
    const peg = nearestStudFromNative(native.x, native.y)
    return { x: peg.gx, y: peg.gy }
  })
}

/** Eight plate pegs under the brick from position pin (coded snap). */
export function footprintCells(
  positionGx: number,
  positionGy: number,
  pivot: BrickPivot,
): { x: number; y: number }[] {
  const originPeg = blockOriginPegFromPosition(positionGx, positionGy, pivot)
  return footprintCellsFromBlockOrigin(originPeg.gx, originPeg.gy, pivot)
}

function cellKey(x: number, y: number): string {
  return `${x},${y}`
}

/** True when the full 2×4 footprint stays on the 10×10 plate. */
export function positionPinFits(
  positionGx: number,
  positionGy: number,
  pivot: BrickPivot,
): boolean {
  const cells = footprintCells(positionGx, positionGy, pivot)
  return cells.every(
    (c) => c.x >= 0 && c.x < PLATE_STUDS && c.y >= 0 && c.y < PLATE_STUDS,
  )
}

/** Where the pivot’s snap anchor sits on the board (from brick box top-left). */
export function boardSnapPointFromBrickPlacement(
  localLeft: number,
  localTop: number,
  displayWidth: number,
  pivot: BrickPivot,
  level = 0,
  layerLift = 0,
): { x: number; y: number } {
  const s = boardScale(displayWidth)
  const anchor = placementSnapAnchor(pivot)
  return {
    x: localLeft / s + anchor.x,
    y: localTop / s + anchor.y + (level * layerLift) / s,
  }
}

/** Closest valid position pin so coded snap lands on this board point. */
export function positionPinFromBoardSnapPoint(
  snapNative: { x: number; y: number },
  pivot: BrickPivot,
): PegCoord {
  let best: PegCoord = { gx: 2, gy: 2 }
  let bestD = Infinity
  for (let gy = 0; gy < PLATE_STUDS; gy++) {
    for (let gx = 0; gx < PLATE_STUDS; gx++) {
      if (!positionPinFits(gx, gy, pivot)) continue
      const target = placementBoardTarget(gx, gy, pivot)
      const d =
        (target.x - snapNative.x) * (target.x - snapNative.x) +
        (target.y - snapNative.y) * (target.y - snapNative.y)
      if (d < bestD) {
        bestD = d
        best = { gx, gy }
      } else if (d === bestD) {
        if (
          positionPinToBlockSeparationSq(gx, gy, pivot) <
          positionPinToBlockSeparationSq(best.gx, best.gy, pivot)
        ) {
          best = { gx, gy }
        }
      }
    }
  }
  return best
}

export function clampBrickAnchor(
  positionGx: number,
  positionGy: number,
  pivot: BrickPivot,
): { gx: number; gy: number } {
  const gx = Math.max(0, Math.min(PLATE_STUDS - 1, positionGx))
  const gy = Math.max(0, Math.min(PLATE_STUDS - 1, positionGy))
  if (positionPinFits(gx, gy, pivot)) return { gx, gy }
  const { x, y } = studToNative(gx, gy)
  return positionPinFromBoardSnapPoint({ x, y }, pivot)
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

/**
 * Nearest valid position pin whose snapped brick box best matches on-screen
 * left/top (minimizes release jump after free drag).
 */
export function snapPositionPinFromScreen(
  localLeft: number,
  localTop: number,
  displayWidth: number,
  pivot: BrickPivot,
  prefer?: PegCoord,
): PegCoord {
  let best: PegCoord = prefer ?? { gx: 2, gy: 2 }
  let bestD = Infinity
  for (let gy = 0; gy < PLATE_STUDS; gy++) {
    for (let gx = 0; gx < PLATE_STUDS; gx++) {
      if (!positionPinFits(gx, gy, pivot)) continue
      const placement = brickPlacement(displayWidth, gx, gy, pivot, 0, 0)
      const d =
        (placement.left - localLeft) * (placement.left - localLeft) +
        (placement.top - localTop) * (placement.top - localTop)
      if (d < bestD) {
        bestD = d
        best = { gx, gy }
      } else if (
        prefer &&
        d === bestD &&
        gx === prefer.gx &&
        gy === prefer.gy
      ) {
        best = { gx, gy }
      }
    }
  }
  return best
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
  const snap = boardSnapPointFromBrickPlacement(
    localLeft,
    localTop,
    displayWidth,
    pivot,
    level,
    layerLift,
  )
  return positionPinFromBoardSnapPoint(snap, pivot)
}

/** Snap brick box to nearest on-plate placement (full 2×4 footprint on grid). */
export function clampBrickPlacementToPlate(
  localLeft: number,
  localTop: number,
  displayWidth: number,
  pivot: BrickPivot,
  level = 0,
  layerLift = 0,
): { peg: PegCoord; placement: ReturnType<typeof brickPlacement> } {
  const peg = positionPinFromBrickPlacement(
    localLeft,
    localTop,
    displayWidth,
    pivot,
    level,
    layerLift,
  )
  return {
    peg,
    placement: brickPlacement(
      displayWidth,
      peg.gx,
      peg.gy,
      pivot,
      level,
      layerLift,
    ),
  }
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

/** Nearest on-plate position pin + brick screen placement from a board-native point. */
export function snappedPlacementFromNative(
  nativeX: number,
  nativeY: number,
  displayWidth: number,
  pivot: BrickPivot,
  level = 0,
  layerLift = 0,
): { peg: PegCoord; placement: ReturnType<typeof brickPlacement> } {
  const peg = positionPinFromBoardSnapPoint(
    { x: nativeX, y: nativeY },
    pivot,
  )
  return {
    peg,
    placement: brickPlacement(
      displayWidth,
      peg.gx,
      peg.gy,
      pivot,
      level,
      layerLift,
    ),
  }
}
