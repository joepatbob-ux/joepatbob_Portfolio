'use client'

import { useCallback, useMemo, useState } from 'react'
import {
  blockOriginPegFromPosition,
  footprintCells,
  type BrickPivot,
} from '@/lib/formation/legoBricks'
import { formatLegoSnapDebugReport } from '@/lib/formation/legoDebugReport'
import { pegLabel, PLATE_STUDS } from '@/lib/formation/legoGrid'
import { cornerMarkerKey, CORNER_PEG_MARKERS } from '@/lib/formation/legoPegMarkers'

type PegCoord = { gx: number; gy: number }

const CORNER_COLOR_BY_KEY = Object.fromEntries(
  CORNER_PEG_MARKERS.map((m) => [`${m.gx},${m.gy}`, m.color]),
)

type Props = {
  pivot: BrickPivot
  positionPin: PegCoord
  boardDisplayW: number
  brickPlacementScreen: { left: number; top: number }
  isDragging: boolean
}

export function FormationLegoTopDownGrid({
  pivot,
  positionPin,
  boardDisplayW,
  brickPlacementScreen,
  isDragging,
}: Props) {
  const [copied, setCopied] = useState(false)

  const blockOrigin = blockOriginPegFromPosition(
    positionPin.gx,
    positionPin.gy,
    pivot,
  )
  const footprint = footprintCells(positionPin.gx, positionPin.gy, pivot)
  const footprintSet = new Set(footprint.map((c) => `${c.x},${c.y}`))

  const debugReportText = useMemo(
    () =>
      formatLegoSnapDebugReport({
        pivot,
        positionPin,
        brickScreen: brickPlacementScreen,
        boardDisplayW,
        isDragging,
      }),
    [boardDisplayW, brickPlacementScreen, isDragging, pivot, positionPin],
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

  const cells: { gx: number; gy: number; label: string }[] = []
  for (let gy = PLATE_STUDS - 1; gy >= 0; gy--) {
    for (let gx = 0; gx < PLATE_STUDS; gx++) {
      cells.push({ gx, gy, label: pegLabel(gx, gy) })
    }
  }

  return (
    <details className="formation-lego__debug">
      <summary className="formation-lego__debug-summary">
        Snap debug
        <span className="formation-lego__debug-summary-pill">
          {pegLabel(positionPin.gx, positionPin.gy)}
        </span>
      </summary>

      <div className="formation-lego__debug-body">
        <p className="formation-lego__debug-line">
          Pin <strong>{pegLabel(positionPin.gx, positionPin.gy)}</strong> · block{' '}
          <strong>{pegLabel(blockOrigin.gx, blockOrigin.gy)}</strong> · {pivot}{' '}
          pivot
        </p>

        <div className="formation-lego__topdown-wrap formation-lego__topdown-wrap--compact">
          <div
            className="formation-lego__topdown-grid"
            role="img"
            aria-label="Active block footprint on 10 by 10 grid"
          >
            {cells.map(({ gx, gy, label }) => {
              const key = `${gx},${gy}`
              const ck = cornerMarkerKey(gx, gy)
              const cornerColor = ck ? CORNER_COLOR_BY_KEY[ck] : undefined
              const inFoot = footprintSet.has(key)
              const isPin =
                gx === positionPin.gx && gy === positionPin.gy
              const isOrigin =
                gx === blockOrigin.gx && gy === blockOrigin.gy

              const classes = [
                'formation-lego__topdown-cell',
                'formation-lego__topdown-cell--readonly',
                ck ? 'formation-lego__topdown-cell--corner' : '',
                inFoot ? 'formation-lego__topdown-cell--iso-foot' : '',
                isPin ? 'formation-lego__topdown-cell--iso-pin' : '',
                isOrigin ? 'formation-lego__topdown-cell--iso-origin' : '',
              ]
                .filter(Boolean)
                .join(' ')

              return (
                <div
                  key={key}
                  className={classes}
                  style={cornerColor ? { background: cornerColor } : undefined}
                  title={label}
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
                </div>
              )
            })}
          </div>
        </div>

        <p className="formation-lego__debug-legend">
          Orange outline = active block footprint · pin cell · block 0,0
        </p>

        <button
          type="button"
          className="formation-lego__topdown-copy"
          onClick={() => void copyReport()}
        >
          {copied ? 'Copied' : 'Copy debug text'}
        </button>

        <textarea
          className="formation-lego__topdown-report"
          readOnly
          rows={8}
          value={debugReportText}
          aria-label="Snap debug report"
        />
      </div>
    </details>
  )
}
