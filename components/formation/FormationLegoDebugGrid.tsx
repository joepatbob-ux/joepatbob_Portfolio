'use client'

import {
  GX_LETTERS,
  pegLabel,
  PEG_MAP,
  pegScreenPosition,
} from '@/lib/formation/legoGrid'

type PegCoord = { gx: number; gy: number }

/** Footprint cells from `footprintCells` use x/y for gx/gy. */
type FootprintCell = { x: number; y: number }

type Props = {
  boardWidth: number
  footprint: FootprintCell[]
  positionPin: PegCoord
  onPegSelect: (gx: number, gy: number) => void
}

export function FormationLegoDebugGrid({
  boardWidth,
  footprint,
  positionPin,
  onPegSelect,
}: Props) {
  const footprintSet = new Set(footprint.map((c) => `${c.x},${c.y}`))

  return (
    <div
      className="formation-lego__debug-pegs"
      aria-label="Plate grid debug overlay"
    >
      <div
        className="formation-lego__grid-axis formation-lego__grid-axis--left"
        aria-hidden
      >
        <span className="formation-lego__grid-axis-title">GY</span>
        {PEG_MAP.filter((p) => p.gx === 0).map((peg) => {
          const { left, top } = pegScreenPosition(peg.gx, peg.gy, boardWidth)
          return (
            <span
              key={`gy-${peg.gy}`}
              className="formation-lego__grid-axis-tick"
              style={{ left, top }}
            >
              {peg.gy}
            </span>
          )
        })}
      </div>
      <div
        className="formation-lego__grid-axis formation-lego__grid-axis--right"
        aria-hidden
      >
        <span className="formation-lego__grid-axis-title">GX</span>
        {PEG_MAP.filter((p) => p.gy === 0).map((peg) => {
          const { left, top } = pegScreenPosition(peg.gx, peg.gy, boardWidth)
          return (
            <span
              key={`gx-${peg.gx}`}
              className="formation-lego__grid-axis-tick"
              style={{ left, top }}
            >
              {GX_LETTERS[peg.gx]}
            </span>
          )
        })}
      </div>
      {PEG_MAP.map((peg) => {
        const key = `${peg.gx},${peg.gy}`
        const inFootprint = footprintSet.has(key)
        const isPositionPin =
          peg.gx === positionPin.gx && peg.gy === positionPin.gy
        const { left, top } = pegScreenPosition(peg.gx, peg.gy, boardWidth)
        return (
          <button
            key={key}
            type="button"
            className={[
              'formation-lego__peg',
              inFootprint ? 'formation-lego__peg--footprint' : '',
              isPositionPin ? 'formation-lego__peg--pin' : '',
            ]
              .filter(Boolean)
              .join(' ')}
            style={{ left, top }}
            tabIndex={-1}
            aria-label={`Stud ${pegLabel(peg.gx, peg.gy)}, gx ${peg.gx}, gy ${peg.gy}`}
            onClick={() => onPegSelect(peg.gx, peg.gy)}
          />
        )
      })}
    </div>
  )
}
