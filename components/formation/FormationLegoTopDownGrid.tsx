'use client'

import { useCallback, useMemo, useRef, useState } from 'react'
import {
  blockOriginPegFromPosition,
  footprintCells,
  footprintCellsFromBlockOrigin,
  placementBoardTarget,
  pivotLayout,
  type BrickPivot,
} from '@/lib/formation/legoBricks'
import { formatLegoSnapDebugReport } from '@/lib/formation/legoDebugReport'
import {
  buildLockedRelationship,
  formatAllLockedRelationships,
  snapshotIsoPlacement,
  snapshotProbePlacement,
  type IsoPlacementSnapshot,
  type LockedRelationship,
} from '@/lib/formation/legoRelationshipRecord'
import { pegLabel, PLATE_STUDS } from '@/lib/formation/legoGrid'
import { cornerMarkerKey, CORNER_PEG_MARKERS } from '@/lib/formation/legoPegMarkers'

type PegCoord = { gx: number; gy: number }
type PlaceMode = 'pin' | 'block'

const CORNER_COLOR_BY_KEY = Object.fromEntries(
  CORNER_PEG_MARKERS.map((m) => [`${m.gx},${m.gy}`, m.color]),
)

function pegFromPointer(
  clientX: number,
  clientY: number,
  gridEl: HTMLElement,
): PegCoord | null {
  const rect = gridEl.getBoundingClientRect()
  if (
    clientX < rect.left ||
    clientX > rect.right ||
    clientY < rect.top ||
    clientY > rect.bottom
  ) {
    return null
  }
  const gx = Math.min(
    PLATE_STUDS - 1,
    Math.max(0, Math.floor(((clientX - rect.left) / rect.width) * PLATE_STUDS)),
  )
  const row = Math.min(
    PLATE_STUDS - 1,
    Math.max(0, Math.floor(((clientY - rect.top) / rect.height) * PLATE_STUDS)),
  )
  const gy = PLATE_STUDS - 1 - row
  return { gx, gy }
}

function footprintBounds(cells: { x: number; y: number }[]) {
  let minGx = PLATE_STUDS
  let maxGx = 0
  let minGy = PLATE_STUDS
  let maxGy = 0
  for (const c of cells) {
    minGx = Math.min(minGx, c.x)
    maxGx = Math.max(maxGx, c.x)
    minGy = Math.min(minGy, c.y)
    maxGy = Math.max(maxGy, c.y)
  }
  return { minGx, maxGx, minGy, maxGy }
}

function clampPlatePeg(gx: number, gy: number): PegCoord {
  return {
    gx: Math.max(0, Math.min(PLATE_STUDS - 1, gx)),
    gy: Math.max(0, Math.min(PLATE_STUDS - 1, gy)),
  }
}

function cellOverlayStyle(gx: number, gy: number) {
  return {
    left: `${(gx / PLATE_STUDS) * 100}%`,
    top: `${((PLATE_STUDS - 1 - gy) / PLATE_STUDS) * 100}%`,
    width: `${(1 / PLATE_STUDS) * 100}%`,
    height: `${(1 / PLATE_STUDS) * 100}%`,
  }
}

function brickOverlayStyle(cells: { x: number; y: number }[]) {
  const bounds = footprintBounds(cells)
  const spanGx = bounds.maxGx - bounds.minGx + 1
  const spanGy = bounds.maxGy - bounds.minGy + 1
  return {
    left: `${(bounds.minGx / PLATE_STUDS) * 100}%`,
    top: `${((PLATE_STUDS - 1 - bounds.maxGy) / PLATE_STUDS) * 100}%`,
    width: `${(spanGx / PLATE_STUDS) * 100}%`,
    height: `${(spanGy / PLATE_STUDS) * 100}%`,
  }
}

type Props = {
  pivot: BrickPivot
  /** Coded placement from isometric board (read-only on this grid). */
  isoPositionPin: PegCoord
  boardDisplayW: number
  brickPlacementScreen: { left: number; top: number }
  isDragging: boolean
}

export function FormationLegoTopDownGrid({
  pivot,
  isoPositionPin,
  boardDisplayW,
  brickPlacementScreen,
  isDragging,
}: Props) {
  const [placeMode, setPlaceMode] = useState<PlaceMode>('block')
  const [probePositionPin, setProbePositionPin] = useState<PegCoord>(() => ({
    gx: isoPositionPin.gx,
    gy: isoPositionPin.gy,
  }))
  const [probeBlockOrigin, setProbeBlockOrigin] = useState<PegCoord>(() =>
    blockOriginPegFromPosition(isoPositionPin.gx, isoPositionPin.gy, pivot),
  )
  const [copied, setCopied] = useState(false)
  const [copiedLocked, setCopiedLocked] = useState(false)
  const [recordedIso, setRecordedIso] = useState<IsoPlacementSnapshot | null>(
    null,
  )
  const [lockedRecords, setLockedRecords] = useState<LockedRelationship[]>([])
  const gridRef = useRef<HTMLDivElement>(null)
  const dragKindRef = useRef<'block' | 'pin' | null>(null)
  const blockDragDeltaRef = useRef<{ dgx: number; dgy: number } | null>(null)

  const isoFootprint = footprintCells(isoPositionPin.gx, isoPositionPin.gy, pivot)
  const isoFootprintSet = new Set(isoFootprint.map((c) => `${c.x},${c.y}`))
  const isoBlockOrigin = blockOriginPegFromPosition(
    isoPositionPin.gx,
    isoPositionPin.gy,
    pivot,
  )
  const isoSnapTarget = placementBoardTarget(
    isoPositionPin.gx,
    isoPositionPin.gy,
    pivot,
  )

  const probeFootprint = footprintCellsFromBlockOrigin(
    probeBlockOrigin.gx,
    probeBlockOrigin.gy,
    pivot,
  )
  const probeFootprintSet = new Set(probeFootprint.map((c) => `${c.x},${c.y}`))
  const codedProbeOrigin = blockOriginPegFromPosition(
    probePositionPin.gx,
    probePositionPin.gy,
    pivot,
  )
  const pinOriginDelta = {
    dgx: probeBlockOrigin.gx - codedProbeOrigin.gx,
    dgy: probeBlockOrigin.gy - codedProbeOrigin.gy,
  }
  const { longAlong } = pivotLayout(pivot)

  const debugReportText = useMemo(
    () =>
      formatLegoSnapDebugReport({
        pivot,
        positionPin: isoPositionPin,
        brickScreen: brickPlacementScreen,
        boardDisplayW,
        isDragging,
        probePositionPin,
        probeBlockOrigin,
      }),
    [
      boardDisplayW,
      brickPlacementScreen,
      isDragging,
      isoPositionPin,
      pivot,
      probeBlockOrigin,
      probePositionPin,
    ],
  )

  const recordIsoPlacement = useCallback(() => {
    if (isDragging) return
    setRecordedIso(
      snapshotIsoPlacement({
        pivot,
        positionPin: isoPositionPin,
        boardDisplayW,
        brickScreen: brickPlacementScreen,
      }),
    )
  }, [
    boardDisplayW,
    brickPlacementScreen,
    isDragging,
    isoPositionPin,
    pivot,
  ])

  const lockRelationship = useCallback(() => {
    if (!recordedIso) return
    const probe = snapshotProbePlacement({
      pivot,
      positionPin: probePositionPin,
      blockOrigin: probeBlockOrigin,
    })
    setLockedRecords((prev) => [
      ...prev,
      buildLockedRelationship({ pivot, iso: recordedIso, probe }),
    ])
  }, [pivot, probeBlockOrigin, probePositionPin, recordedIso])

  const syncProbeFromIso = useCallback(() => {
    const source = recordedIso ?? {
      positionPin: isoPositionPin,
      blockOrigin: isoBlockOrigin,
    }
    setProbePositionPin({ gx: source.positionPin.gx, gy: source.positionPin.gy })
    setProbeBlockOrigin({
      gx: source.blockOrigin.gx,
      gy: source.blockOrigin.gy,
    })
  }, [isoBlockOrigin, isoPositionPin, recordedIso])

  const lockedReportText = useMemo(
    () => formatAllLockedRelationships(lockedRecords),
    [lockedRecords],
  )

  const isoMovedSinceRecord =
    recordedIso != null &&
    (recordedIso.positionPin.gx !== isoPositionPin.gx ||
      recordedIso.positionPin.gy !== isoPositionPin.gy)

  const pendingLock =
    recordedIso != null &&
    !isoMovedSinceRecord &&
    (recordedIso.blockOrigin.gx !== probeBlockOrigin.gx ||
      recordedIso.blockOrigin.gy !== probeBlockOrigin.gy ||
      recordedIso.positionPin.gx !== probePositionPin.gx ||
      recordedIso.positionPin.gy !== probePositionPin.gy)

  const applyBlockDragAt = useCallback((clientX: number, clientY: number) => {
    if (!blockDragDeltaRef.current || !gridRef.current) return
    const peg = pegFromPointer(clientX, clientY, gridRef.current)
    if (!peg) return
    setProbeBlockOrigin(
      clampPlatePeg(
        peg.gx - blockDragDeltaRef.current.dgx,
        peg.gy - blockDragDeltaRef.current.dgy,
      ),
    )
  }, [])

  const onProbeBrickPointerDown = useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault()
      e.stopPropagation()
      if (!gridRef.current) return
      const peg = pegFromPointer(e.clientX, e.clientY, gridRef.current)
      if (!peg) return
      dragKindRef.current = 'block'
      blockDragDeltaRef.current = {
        dgx: peg.gx - probeBlockOrigin.gx,
        dgy: peg.gy - probeBlockOrigin.gy,
      }
      gridRef.current.setPointerCapture(e.pointerId)
    },
    [probeBlockOrigin.gx, probeBlockOrigin.gy],
  )

  const onProbePinPointerDown = useCallback((e: React.PointerEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!gridRef.current) return
    dragKindRef.current = 'pin'
    gridRef.current.setPointerCapture(e.pointerId)
  }, [])

  const onGridPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!dragKindRef.current || !gridRef.current) return
      if (dragKindRef.current === 'block') {
        applyBlockDragAt(e.clientX, e.clientY)
        return
      }
      const peg = pegFromPointer(e.clientX, e.clientY, gridRef.current)
      if (peg) setProbePositionPin(clampPlatePeg(peg.gx, peg.gy))
    },
    [applyBlockDragAt],
  )

  const endGridDrag = useCallback((e: React.PointerEvent) => {
    if (gridRef.current?.hasPointerCapture(e.pointerId)) {
      gridRef.current.releasePointerCapture(e.pointerId)
    }
    dragKindRef.current = null
    blockDragDeltaRef.current = null
  }, [])

  const onCellClick = useCallback(
    (gx: number, gy: number) => {
      if (placeMode === 'pin') {
        setProbePositionPin(clampPlatePeg(gx, gy))
      } else {
        setProbeBlockOrigin(clampPlatePeg(gx, gy))
      }
    },
    [placeMode],
  )

  const copyReport = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(debugReportText)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      setCopied(false)
    }
  }, [debugReportText])

  const copyLocked = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(lockedReportText)
      setCopiedLocked(true)
      window.setTimeout(() => setCopiedLocked(false), 2000)
    } catch {
      setCopiedLocked(false)
    }
  }, [lockedReportText])

  const cells: { gx: number; gy: number; label: string }[] = []
  for (let gy = PLATE_STUDS - 1; gy >= 0; gy--) {
    for (let gx = 0; gx < PLATE_STUDS; gx++) {
      cells.push({ gx, gy, label: pegLabel(gx, gy) })
    }
  }

  const mismatch =
    isoFootprintSet.size !== probeFootprintSet.size ||
    [...isoFootprintSet].some((k) => !probeFootprintSet.has(k))

  return (
    <div className="formation-lego__topdown">
      <p className="formation-lego__topdown-title">
        Tune peg math: record iso → align 2D probe → lock relationship
      </p>

      <ol className="formation-lego__topdown-steps">
        <li>Move cyan brick on the isometric plate.</li>
        <li>
          <strong>Record iso placement</strong> (freezes coded pegs for this step).
        </li>
        <li>Drag probe 2×4 + pin on this grid to match what you see.</li>
        <li>
          <strong>Lock relationship</strong> (saves deltas for copy/paste).
        </li>
      </ol>

      <div className="formation-lego__topdown-toolbar formation-lego__topdown-toolbar--record">
        <button
          type="button"
          className="formation-lego__topdown-record"
          disabled={isDragging}
          onClick={recordIsoPlacement}
        >
          1 · Record iso placement
        </button>
        <button
          type="button"
          className="formation-lego__topdown-lock"
          disabled={!recordedIso || isoMovedSinceRecord}
          onClick={lockRelationship}
        >
          2 · Lock relationship
          {lockedRecords.length > 0 ? ` (${lockedRecords.length})` : ''}
        </button>
        <button
          type="button"
          className="formation-lego__topdown-copy"
          disabled={lockedRecords.length === 0}
          onClick={() => void copyLocked()}
        >
          {copiedLocked ? 'Copied' : 'Copy locked'}
        </button>
      </div>

      <p
        className={
          isoMovedSinceRecord
            ? 'formation-lego__topdown-status formation-lego__topdown-status--warn'
            : recordedIso
              ? 'formation-lego__topdown-status'
              : 'formation-lego__topdown-status formation-lego__topdown-status--muted'
        }
      >
        {isoMovedSinceRecord
          ? 'Iso moved after last record — click Record iso again before locking.'
          : recordedIso
            ? `Recorded iso: pin ${pegLabel(recordedIso.positionPin.gx, recordedIso.positionPin.gy)}, block ${pegLabel(recordedIso.blockOrigin.gx, recordedIso.blockOrigin.gy)}${pendingLock ? ' · probe ready to lock' : ''}`
            : 'No iso recorded yet — move the brick on the plate, then Record iso.'}
      </p>

      <div className="formation-lego__topdown-toolbar">
        <span className="formation-lego__topdown-toolbar-label">Probe (2D only):</span>
        <button
          type="button"
          className={
            placeMode === 'block'
              ? 'formation-lego__topdown-mode formation-lego__topdown-mode--active'
              : 'formation-lego__topdown-mode'
          }
          onClick={() => setPlaceMode('block')}
        >
          2×4 block (0,0)
        </button>
        <button
          type="button"
          className={
            placeMode === 'pin'
              ? 'formation-lego__topdown-mode formation-lego__topdown-mode--active'
              : 'formation-lego__topdown-mode'
          }
          onClick={() => setPlaceMode('pin')}
        >
          Position pin
        </button>
        <button
          type="button"
          className="formation-lego__topdown-mode"
          onClick={syncProbeFromIso}
        >
          Match iso coded
        </button>
        <button
          type="button"
          className="formation-lego__topdown-copy"
          onClick={() => void copyReport()}
        >
          {copied ? 'Copied' : 'Copy snap debug'}
        </button>
      </div>

      <p className="formation-lego__topdown-legend">
        <span className="formation-lego__swatch formation-lego__swatch--iso" /> Iso coded
        (from snap math) ·{' '}
        <span className="formation-lego__swatch formation-lego__swatch--probe" /> probe block ·{' '}
        <span className="formation-lego__swatch formation-lego__swatch--pin" /> probe pin
        (drag orange handle) ·{' '}
        <span className="formation-lego__swatch formation-lego__swatch--mismatch" />{' '}
        mismatch{mismatch ? ' — footprints differ' : ''}
      </p>

      <div className="formation-lego__topdown-wrap">
        <div className="formation-lego__topdown-axis formation-lego__topdown-axis--y" aria-hidden>
          <span>+GY</span>
          <span>9</span>
          <span>0</span>
        </div>
        <div className="formation-lego__topdown-axis formation-lego__topdown-axis--x" aria-hidden>
          <span>+GX →</span>
          <span>A</span>
          <span>J</span>
        </div>
        <div
          ref={gridRef}
          className="formation-lego__topdown-grid"
          role="grid"
          aria-label="10 by 10 peg grid"
          onPointerMove={onGridPointerMove}
          onPointerUp={endGridDrag}
          onPointerCancel={endGridDrag}
        >
          {cells.map(({ gx, gy, label }) => {
            const key = `${gx},${gy}`
            const ck = cornerMarkerKey(gx, gy)
            const cornerColor = ck ? CORNER_COLOR_BY_KEY[ck] : undefined
            const inIso = isoFootprintSet.has(key)
            const inProbe = probeFootprintSet.has(key)
            const isIsoPin =
              gx === isoPositionPin.gx && gy === isoPositionPin.gy
            const isProbePin =
              gx === probePositionPin.gx && gy === probePositionPin.gy
            const isIsoOrigin =
              gx === isoBlockOrigin.gx && gy === isoBlockOrigin.gy
            const isProbeOrigin =
              gx === probeBlockOrigin.gx && gy === probeBlockOrigin.gy
            const mismatchCell =
              (inIso && !inProbe) || (inProbe && !inIso)

            const classes = [
              'formation-lego__topdown-cell',
              ck ? 'formation-lego__topdown-cell--corner' : '',
              inIso ? 'formation-lego__topdown-cell--iso-foot' : '',
              inProbe ? 'formation-lego__topdown-cell--probe-foot' : '',
              mismatchCell ? 'formation-lego__topdown-cell--mismatch' : '',
              isIsoPin ? 'formation-lego__topdown-cell--iso-pin' : '',
              isProbePin ? 'formation-lego__topdown-cell--probe-pin' : '',
              isIsoOrigin ? 'formation-lego__topdown-cell--iso-origin' : '',
              isProbeOrigin ? 'formation-lego__topdown-cell--probe-origin' : '',
            ]
              .filter(Boolean)
              .join(' ')

            return (
              <button
                key={key}
                type="button"
                className={classes}
                style={cornerColor ? { background: cornerColor } : undefined}
                title={label}
                onClick={() => onCellClick(gx, gy)}
              >
                <span
                  className={
                    gx === 9 && gy === 9
                      ? 'formation-lego__topdown-label formation-lego__topdown-label--light'
                      : 'formation-lego__topdown-label'
                  }
                >
                  {label}
                </span>
              </button>
            )
          })}

          <div
            className="formation-lego__topdown-brick formation-lego__topdown-brick--probe"
            style={brickOverlayStyle(probeFootprint)}
            title="Drag: 2×4 footprint from block 0,0 (does not move iso)"
            onPointerDown={onProbeBrickPointerDown}
          >
            <span className="formation-lego__topdown-brick-label">2×4</span>
          </div>

          <div
            className="formation-lego__topdown-pin-handle"
            style={cellOverlayStyle(probeBlockOrigin.gx, probeBlockOrigin.gy)}
            aria-hidden
          >
            <span className="formation-lego__topdown-origin-tag">0,0</span>
          </div>

          <div
            className="formation-lego__topdown-pin-handle formation-lego__topdown-pin-handle--draggable"
            style={cellOverlayStyle(probePositionPin.gx, probePositionPin.gy)}
            title="Drag: position pin (independent of block corner)"
            onPointerDown={onProbePinPointerDown}
          >
            <span className="formation-lego__topdown-pin-tag">pin</span>
          </div>
        </div>
      </div>

      <dl className="formation-lego__topdown-readout">
        <div>
          <dt>Recorded iso (frozen)</dt>
          <dd>
            {recordedIso
              ? `pin ${pegLabel(recordedIso.positionPin.gx, recordedIso.positionPin.gy)} · block ${pegLabel(recordedIso.blockOrigin.gx, recordedIso.blockOrigin.gy)}`
              : '— not recorded —'}
          </dd>
        </div>
        <div>
          <dt>Live iso (plate now)</dt>
          <dd>
            pin {pegLabel(isoPositionPin.gx, isoPositionPin.gy)} · block{' '}
            {pegLabel(isoBlockOrigin.gx, isoBlockOrigin.gy)}
          </dd>
        </div>
        <div>
          <dt>Iso coded · pin</dt>
          <dd>
            {pegLabel(isoPositionPin.gx, isoPositionPin.gy)} (gx {isoPositionPin.gx}, gy{' '}
            {isoPositionPin.gy})
          </dd>
        </div>
        <div>
          <dt>Iso coded · block 0,0</dt>
          <dd>
            {pegLabel(isoBlockOrigin.gx, isoBlockOrigin.gy)} · footprint{' '}
            {isoFootprint.map((c) => pegLabel(c.x, c.y)).join(', ')}
          </dd>
        </div>
        <div>
          <dt>Iso snap target</dt>
          <dd>
            {isoSnapTarget.x.toFixed(1)}, {isoSnapTarget.y.toFixed(1)} · screen{' '}
            {brickPlacementScreen.left.toFixed(0)}, {brickPlacementScreen.top.toFixed(0)}
          </dd>
        </div>
        <div>
          <dt>2D probe · position pin</dt>
          <dd>
            {pegLabel(probePositionPin.gx, probePositionPin.gy)} (gx{' '}
            {probePositionPin.gx}, gy {probePositionPin.gy})
          </dd>
        </div>
        <div>
          <dt>2D probe · block 0,0</dt>
          <dd>
            {pegLabel(probeBlockOrigin.gx, probeBlockOrigin.gy)} (gx{' '}
            {probeBlockOrigin.gx}, gy {probeBlockOrigin.gy})
          </dd>
        </div>
        <div>
          <dt>Pin vs block corner Δ</dt>
          <dd>
            gx {pinOriginDelta.dgx}, gy {pinOriginDelta.dgy} (coded pin would put
            0,0 at {pegLabel(codedProbeOrigin.gx, codedProbeOrigin.gy)})
          </dd>
        </div>
        <div>
          <dt>2D probe footprint</dt>
          <dd>{probeFootprint.map((c) => pegLabel(c.x, c.y)).join(', ')}</dd>
        </div>
        <div>
          <dt>Pivot</dt>
          <dd>
            {pivot} · long axis {longAlong.toUpperCase()}
          </dd>
        </div>
      </dl>

      <label className="formation-lego__topdown-report-label">
        Locked relationships (paste to agent)
      </label>
      <textarea
        className="formation-lego__topdown-report formation-lego__topdown-report--locked"
        readOnly
        rows={8}
        value={lockedReportText}
        aria-label="Locked relationship records"
      />

      <label className="formation-lego__topdown-report-label">
        Live snap debug
      </label>
      <textarea
        className="formation-lego__topdown-report"
        readOnly
        rows={10}
        value={debugReportText}
        aria-label="Snap debug report"
      />

      <p className="formation-lego__topdown-hint">
        The 2D probe never moves the iso brick. Lock saves{' '}
        <code>suggested_pin_to_block_offset</code> from your visual alignment.
      </p>
    </div>
  )
}
