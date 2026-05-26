import {
  blockOriginNativeFromPosition,
  blockOriginPegFromPosition,
  boardSnapPointFromBrickPlacement,
  footprintCells,
  footprintCellsFromBlockOrigin,
  placementBoardTarget,
  placementSnapAnchor,
  pivotLayout,
  positionPinFits,
  type BrickPivot,
} from '@/lib/formation/legoBricks'
import { pegLabel, studToNative } from '@/lib/formation/legoGrid'

export type LegoSnapDebugInput = {
  pivot: BrickPivot
  positionPin: { gx: number; gy: number }
  brickScreen: { left: number; top: number }
  boardDisplayW: number
  isDragging: boolean
  /** Independent 2D probe — does not move the isometric brick. */
  probePositionPin?: { gx: number; gy: number }
  /** Probe block 0,0 — may differ from pin-derived origin when tuning alignment. */
  probeBlockOrigin?: { gx: number; gy: number }
}

function footprintDiff(
  a: { x: number; y: number }[],
  b: { x: number; y: number }[],
): { onlyA: string[]; onlyB: string[]; overlap: string[] } {
  const setA = new Set(a.map((c) => `${c.x},${c.y}`))
  const setB = new Set(b.map((c) => `${c.x},${c.y}`))
  const onlyA: string[] = []
  const onlyB: string[] = []
  const overlap: string[] = []
  for (const k of setA) {
    const [x, y] = k.split(',').map(Number)
    const label = pegLabel(x, y)
    if (setB.has(k)) overlap.push(label)
    else onlyA.push(label)
  }
  for (const k of setB) {
    if (!setA.has(k)) {
      const [x, y] = k.split(',').map(Number)
      onlyB.push(pegLabel(x, y))
    }
  }
  return { onlyA, onlyB, overlap }
}

export function formatLegoSnapDebugReport(input: LegoSnapDebugInput): string {
  const {
    pivot,
    positionPin,
    brickScreen,
    boardDisplayW,
    isDragging,
    probePositionPin,
    probeBlockOrigin,
  } = input
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
    `position_pin: ${pegLabel(gx, gy)} (gx=${gx}, gy=${gy})`,
    `position_pin_native: ${posNative.x.toFixed(2)}, ${posNative.y.toFixed(2)}`,
    `block_origin_peg: ${pegLabel(blockOrigin.gx, blockOrigin.gy)} (gx=${blockOrigin.gx}, gy=${blockOrigin.gy})`,
    `block_origin_native_snapped: ${blockNative.x.toFixed(2)}, ${blockNative.y.toFixed(2)}`,
    `placement_snap_anchor_brick_svg: ${anchor.x.toFixed(2)}, ${anchor.y.toFixed(2)}`,
    `placement_board_target_native: ${snapTarget.x.toFixed(2)}, ${snapTarget.y.toFixed(2)}`,
    `board_snap_from_brick_box_native: ${snapOnBoard.x.toFixed(2)}, ${snapOnBoard.y.toFixed(2)}`,
    `snap_delta_native: ${(snapOnBoard.x - snapTarget.x).toFixed(2)}, ${(snapOnBoard.y - snapTarget.y).toFixed(2)}`,
    `brick_box_screen_px: left=${brickScreen.left.toFixed(1)} top=${brickScreen.top.toFixed(1)} board_w=${boardDisplayW}`,
    '',
    `footprint_8: ${footprint.map((c) => pegLabel(c.x, c.y)).join(', ')}`,
    `footprint_coords: ${footprint.map((c) => `(${c.x},${c.y})`).join(' ')}`,
    '',
    'corner_peg_native:',
    ...(['0,0', '0,9', '9,0', '9,9'] as const).map((k) => {
      const [cx, cy] = k.split(',').map(Number)
      const n = studToNative(cx, cy)
      return `  ${pegLabel(cx, cy)}: ${n.x.toFixed(2)}, ${n.y.toFixed(2)}`
    }),
    '',
  ]

  if (probePositionPin || probeBlockOrigin) {
    const pg = probePositionPin
    const probeOrigin =
      probeBlockOrigin ??
      (pg ? blockOriginPegFromPosition(pg.gx, pg.gy, pivot) : blockOrigin)
    const probeFoot = footprintCellsFromBlockOrigin(
      probeOrigin.gx,
      probeOrigin.gy,
      pivot,
    )
    const codedFromPin = pg
      ? blockOriginPegFromPosition(pg.gx, pg.gy, pivot)
      : null
    const diff = footprintDiff(footprint, probeFoot)
    lines.push(
      '--- 2d_probe (visual expectation; iso unchanged) ---',
      ...(pg
        ? [
            `probe_position_pin: ${pegLabel(pg.gx, pg.gy)} (gx=${pg.gx}, gy=${pg.gy})`,
            ...(codedFromPin
              ? [
                  `probe_pin_implied_block_origin: ${pegLabel(codedFromPin.gx, codedFromPin.gy)} (gx=${codedFromPin.gx}, gy=${codedFromPin.gy})`,
                  `probe_pin_vs_block_origin_delta: gx=${probeOrigin.gx - codedFromPin.gx} gy=${probeOrigin.gy - codedFromPin.gy}`,
                ]
              : []),
          ]
        : []),
      `probe_block_origin: ${pegLabel(probeOrigin.gx, probeOrigin.gy)} (gx=${probeOrigin.gx}, gy=${probeOrigin.gy})`,
      `probe_footprint_8: ${probeFoot.map((c) => pegLabel(c.x, c.y)).join(', ')}`,
      `footprint_overlap: ${diff.overlap.join(', ') || '(none)'}`,
      `iso_only_pegs: ${diff.onlyA.join(', ') || '(none)'}`,
      `probe_only_pegs: ${diff.onlyB.join(', ') || '(none)'}`,
      `iso_origin_vs_probe_block_origin: ${pegLabel(blockOrigin.gx, blockOrigin.gy)} vs ${pegLabel(probeOrigin.gx, probeOrigin.gy)}`,
      '',
    )
  }

  lines.push('--- paste to agent ---')

  return lines.join('\n')
}
