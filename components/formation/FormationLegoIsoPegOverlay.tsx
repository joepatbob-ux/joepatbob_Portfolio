'use client'

import type { CSSProperties } from 'react'
import {
  blockOriginPegFromPosition,
  footprintCells,
  type BrickPivot,
} from '@/lib/formation/legoBricks'
import { pegScreenPosition } from '@/lib/formation/legoGrid'
import {
  CORNER_PEG_MARKERS,
  PEG_MARKER_FOOTPRINT,
  PEG_MARKER_ORIGIN,
  PEG_MARKER_PIN,
} from '@/lib/formation/legoPegMarkers'

type PegCoord = { gx: number; gy: number }

type Props = {
  boardDisplayW: number
  pivot: BrickPivot
  positionPin: PegCoord
}

export function FormationLegoIsoPegOverlay({
  boardDisplayW,
  pivot,
  positionPin,
}: Props) {
  const blockOrigin = blockOriginPegFromPosition(
    positionPin.gx,
    positionPin.gy,
    pivot,
  )
  const footprint = footprintCells(positionPin.gx, positionPin.gy, pivot)
  const cornerKeys = new Set(
    CORNER_PEG_MARKERS.map((m) => `${m.gx},${m.gy}`),
  )

  const pinPos = pegScreenPosition(
    positionPin.gx,
    positionPin.gy,
    boardDisplayW,
  )
  const originPos = pegScreenPosition(
    blockOrigin.gx,
    blockOrigin.gy,
    boardDisplayW,
  )

  return (
    <div className="formation-lego__iso-pegs" aria-hidden>
      {CORNER_PEG_MARKERS.map((marker) => {
        const { left, top } = pegScreenPosition(
          marker.gx,
          marker.gy,
          boardDisplayW,
        )
        const darkLabel = marker.gy === 9 && marker.gx === 9
        return (
          <div
            key={marker.label}
            className="formation-lego__iso-peg formation-lego__iso-peg--corner"
            style={
              {
                left,
                top,
                '--peg-color': marker.color,
              } as CSSProperties
            }
          >
            <span
              className={
                darkLabel
                  ? 'formation-lego__iso-peg-label formation-lego__iso-peg-label--light'
                  : 'formation-lego__iso-peg-label'
              }
            >
              {marker.label}
            </span>
          </div>
        )
      })}

      {footprint.map((cell) => {
        const key = `${cell.x},${cell.y}`
        if (cornerKeys.has(key)) return null
        if (
          (cell.x === positionPin.gx && cell.y === positionPin.gy) ||
          (cell.x === blockOrigin.gx && cell.y === blockOrigin.gy)
        ) {
          return null
        }
        const { left, top } = pegScreenPosition(
          cell.x,
          cell.y,
          boardDisplayW,
        )
        return (
          <div
            key={`foot-${key}`}
            className="formation-lego__iso-peg formation-lego__iso-peg--footprint"
            style={
              {
                left,
                top,
                '--peg-color': PEG_MARKER_FOOTPRINT,
              } as CSSProperties
            }
          />
        )
      })}

      <div
        className="formation-lego__iso-peg formation-lego__iso-peg--origin"
        style={
          {
            left: originPos.left,
            top: originPos.top,
            '--peg-color': PEG_MARKER_ORIGIN,
          } as CSSProperties
        }
      />

      <div
        className="formation-lego__iso-peg formation-lego__iso-peg--pin"
        style={
          {
            left: pinPos.left,
            top: pinPos.top,
            '--peg-color': PEG_MARKER_PIN,
          } as CSSProperties
        }
      />
    </div>
  )
}
