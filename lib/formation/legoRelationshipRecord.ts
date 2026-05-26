import {
  blockOriginPegFromPosition,
  footprintCells,
  footprintCellsFromBlockOrigin,
  placementBoardTarget,
  boardSnapPointFromBrickPlacement,
  type BrickPivot,
} from '@/lib/formation/legoBricks'
import { pegLabel, studToNative } from '@/lib/formation/legoGrid'

export type PegCoord = { gx: number; gy: number }

export type IsoPlacementSnapshot = {
  positionPin: PegCoord
  blockOrigin: PegCoord
  footprint: PegCoord[]
  snapTargetNative: { x: number; y: number }
  snapOnBoardNative: { x: number; y: number }
  brickScreen: { left: number; top: number }
}

export type ProbePlacementSnapshot = {
  positionPin: PegCoord
  blockOrigin: PegCoord
  footprint: PegCoord[]
}

export type LockedRelationship = {
  id: string
  timestamp: string
  pivot: BrickPivot
  iso: IsoPlacementSnapshot
  probe: ProbePlacementSnapshot
  /** probe pin minus iso pin */
  pinDelta: PegCoord
  /** probe block 0,0 minus iso coded block 0,0 */
  blockDelta: PegCoord
  /** probe block 0,0 minus iso position pin (suggested grid offset for code) */
  pinToBlockDelta: PegCoord
}

export function snapshotIsoPlacement(input: {
  pivot: BrickPivot
  positionPin: PegCoord
  boardDisplayW: number
  brickScreen: { left: number; top: number }
}): IsoPlacementSnapshot {
  const { pivot, positionPin, boardDisplayW, brickScreen } = input
  const blockOrigin = blockOriginPegFromPosition(
    positionPin.gx,
    positionPin.gy,
    pivot,
  )
  const footprint = footprintCells(positionPin.gx, positionPin.gy, pivot).map(
    (c) => ({ gx: c.x, gy: c.y }),
  )
  const snapTarget = placementBoardTarget(
    positionPin.gx,
    positionPin.gy,
    pivot,
  )
  const snapOnBoard = boardSnapPointFromBrickPlacement(
    brickScreen.left,
    brickScreen.top,
    boardDisplayW,
    pivot,
  )
  return {
    positionPin: { ...positionPin },
    blockOrigin: { ...blockOrigin },
    footprint,
    snapTargetNative: { ...snapTarget },
    snapOnBoardNative: { ...snapOnBoard },
    brickScreen: { ...brickScreen },
  }
}

export function snapshotProbePlacement(input: {
  pivot: BrickPivot
  positionPin: PegCoord
  blockOrigin: PegCoord
}): ProbePlacementSnapshot {
  const { pivot, positionPin, blockOrigin } = input
  const footprint = footprintCellsFromBlockOrigin(
    blockOrigin.gx,
    blockOrigin.gy,
    pivot,
  ).map((c) => ({ gx: c.x, gy: c.y }))
  return {
    positionPin: { ...positionPin },
    blockOrigin: { ...blockOrigin },
    footprint,
  }
}

export function buildLockedRelationship(input: {
  pivot: BrickPivot
  iso: IsoPlacementSnapshot
  probe: ProbePlacementSnapshot
}): LockedRelationship {
  const { pivot, iso, probe } = input
  return {
    id: `${Date.now()}`,
    timestamp: new Date().toISOString(),
    pivot,
    iso,
    probe,
    pinDelta: {
      gx: probe.positionPin.gx - iso.positionPin.gx,
      gy: probe.positionPin.gy - iso.positionPin.gy,
    },
    blockDelta: {
      gx: probe.blockOrigin.gx - iso.blockOrigin.gx,
      gy: probe.blockOrigin.gy - iso.blockOrigin.gy,
    },
    pinToBlockDelta: {
      gx: probe.blockOrigin.gx - iso.positionPin.gx,
      gy: probe.blockOrigin.gy - iso.positionPin.gy,
    },
  }
}

function pegList(cells: PegCoord[]): string {
  return cells.map((c) => pegLabel(c.gx, c.gy)).join(', ')
}

export function formatLockedRelationship(record: LockedRelationship): string {
  const { iso, probe, pinDelta, blockDelta, pinToBlockDelta, pivot } = record
  return [
    `--- locked relationship ${record.timestamp} ---`,
    `pivot: ${pivot}`,
    '',
    'iso (from isometric board at record time):',
    `  position_pin: ${pegLabel(iso.positionPin.gx, iso.positionPin.gy)} (gx=${iso.positionPin.gx}, gy=${iso.positionPin.gy})`,
    `  pin_native: ${studToNative(iso.positionPin.gx, iso.positionPin.gy).x.toFixed(2)}, ${studToNative(iso.positionPin.gx, iso.positionPin.gy).y.toFixed(2)}`,
    `  block_origin: ${pegLabel(iso.blockOrigin.gx, iso.blockOrigin.gy)} (gx=${iso.blockOrigin.gx}, gy=${iso.blockOrigin.gy})`,
    `  footprint: ${pegList(iso.footprint)}`,
    `  snap_target_native: ${iso.snapTargetNative.x.toFixed(2)}, ${iso.snapTargetNative.y.toFixed(2)}`,
    `  snap_on_board_native: ${iso.snapOnBoardNative.x.toFixed(2)}, ${iso.snapOnBoardNative.y.toFixed(2)}`,
    `  brick_screen_px: left=${iso.brickScreen.left.toFixed(1)} top=${iso.brickScreen.top.toFixed(1)}`,
    '',
    'probe (2d visual — what you aligned):',
    `  position_pin: ${pegLabel(probe.positionPin.gx, probe.positionPin.gy)} (gx=${probe.positionPin.gx}, gy=${probe.positionPin.gy})`,
    `  block_origin: ${pegLabel(probe.blockOrigin.gx, probe.blockOrigin.gy)} (gx=${probe.blockOrigin.gx}, gy=${probe.blockOrigin.gy})`,
    `  footprint: ${pegList(probe.footprint)}`,
    '',
    'deltas (apply to legoBricks.ts tuning):',
    `  probe_pin_minus_iso_pin: gx=${pinDelta.gx} gy=${pinDelta.gy}`,
    `  probe_block_minus_iso_block: gx=${blockDelta.gx} gy=${blockDelta.gy}`,
    `  suggested_pin_to_block_offset: dgx=${pinToBlockDelta.gx} dgy=${pinToBlockDelta.gy}`,
    '',
  ].join('\n')
}

export function formatAllLockedRelationships(records: LockedRelationship[]): string {
  if (records.length === 0) {
    return '(no locked relationships yet — record iso, align 2d probe, then Lock)'
  }
  return records.map(formatLockedRelationship).join('\n')
}
