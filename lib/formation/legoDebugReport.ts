import {
  blockOriginNativeFromPosition,
  blockOriginPegFromPosition,
  boardSnapPointFromBrickPlacement,
  footprintCells,
  placementBoardTarget,
  placementSnapAnchor,
  pivotLayout,
  positionPinFits,
  type BrickPivot,
} from '@/lib/formation/legoBricks'
import {
  pegCoordAnnotation,
  pegLabel,
  pegYLetter,
  studToNative,
} from '@/lib/formation/legoGrid'
import { CORNER_PEG_MARKERS } from '@/lib/formation/legoPegMarkers'

export type LegoSnapDebugInput = {
  pivot: BrickPivot
  positionPin: { gx: number; gy: number }
  brickScreen: { left: number; top: number }
  boardDisplayW: number
  isDragging: boolean
}

export function formatLegoSnapDebugReport(input: LegoSnapDebugInput): string {
  const { pivot, positionPin, brickScreen, boardDisplayW, isDragging } = input
  const { gx, gy } = positionPin
  const blockOrigin = blockOriginPegFromPosition(gx, gy, pivot)
  const footprint = footprintCells(gx, gy, pivot)
  const snapTarget = placementBoardTarget(gx, gy, pivot)
  const snapOnBoard = boardSnapPointFromBrickPlacement(
    brickScreen.left,
    brickScreen.top,
    boardDisplayW,
    pivot,
  )
  const anchor = placementSnapAnchor(pivot)
  const { longAlong } = pivotLayout(pivot)
  const blockNative = blockOriginNativeFromPosition(gx, gy, pivot)
  const posNative = studToNative(gx, gy)
  const fits = positionPinFits(gx, gy, pivot)

  const lines = [
    '=== Formation LEGO snap debug ===',
    `generated: ${new Date().toISOString()}`,
    '',
    `pivot: ${pivot}`,
    `long_axis: ${longAlong}`,
    `is_dragging: ${isDragging}`,
    `position_pin_fits: ${fits}`,
    '',
    `position_pin: ${pegLabel(gx, gy)} — ${pegCoordAnnotation(gx, gy)}`,
    `position_pin_native: ${posNative.x.toFixed(2)}, ${posNative.y.toFixed(2)}`,
    `block_origin_peg: ${pegLabel(blockOrigin.gx, blockOrigin.gy)} — ${pegCoordAnnotation(blockOrigin.gx, blockOrigin.gy)}`,
    `block_origin_native_snapped: ${blockNative.x.toFixed(2)}, ${blockNative.y.toFixed(2)}`,
    `placement_snap_anchor_brick_svg: ${anchor.x.toFixed(2)}, ${anchor.y.toFixed(2)}`,
    `placement_board_target_native: ${snapTarget.x.toFixed(2)}, ${snapTarget.y.toFixed(2)}`,
    `board_snap_from_brick_box_native: ${snapOnBoard.x.toFixed(2)}, ${snapOnBoard.y.toFixed(2)}`,
    `snap_delta_native: ${(snapOnBoard.x - snapTarget.x).toFixed(2)}, ${(snapOnBoard.y - snapTarget.y).toFixed(2)}`,
    `brick_box_screen_px: left=${brickScreen.left.toFixed(1)} top=${brickScreen.top.toFixed(1)} board_w=${boardDisplayW}`,
    '',
    `footprint_8: ${footprint.map((c) => pegLabel(c.x, c.y)).join(', ')}`,
    `footprint_coords: ${footprint.map((c) => `${pegLabel(c.x, c.y)}[x=${c.x} y=${pegYLetter(c.y)}]`).join(' ')}`,
    '',
    'corner_peg_native (cyan A0 → magenta J0 along y):',
    ...CORNER_PEG_MARKERS.map(({ gx: cx, gy: cy, label }) => {
      const n = studToNative(cx, cy)
      return `  ${label}: ${n.x.toFixed(2)}, ${n.y.toFixed(2)} — ${pegCoordAnnotation(cx, cy)}`
    }),
    '',
    '--- paste to agent ---',
  ]

  return lines.join('\n')
}
