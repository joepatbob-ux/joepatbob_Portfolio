'use client'

import { useCallback, useMemo, useState } from 'react'
import {
  BOARD_VIEWBOX,
  boardScale,
  GX_LETTERS,
  pegLabel,
  PEG_MAP,
  pegScreenPosition,
  type PegCoord,
} from '@/lib/formation/legoGrid'
import '@/styles/formation-peg-map.css'

const BOARD_DISPLAY_W = 360
const BOARD_DISPLAY_H = BOARD_VIEWBOX.height * (BOARD_DISPLAY_W / BOARD_VIEWBOX.width)

export function FormationPegMap() {
  const [active, setActive] = useState<PegCoord | null>({ gx: 0, gy: 0 })

  const axisGx = useMemo(
    () =>
      Array.from({ length: 10 }, (_, gx) => ({
        gx,
        ...pegScreenPosition(gx, 0, BOARD_DISPLAY_W),
        label: GX_LETTERS[gx],
      })),
    [],
  )

  const axisGy = useMemo(
    () =>
      Array.from({ length: 10 }, (_, gy) => ({
        gy,
        ...pegScreenPosition(0, gy, BOARD_DISPLAY_W),
        label: String(gy),
      })),
    [],
  )

  const onPegClick = useCallback((gx: number, gy: number) => {
    setActive({ gx, gy })
  }, [])

  const activeLabel = active ? pegLabel(active.gx, active.gy) : '—'

  return (
    <div className="formation-peg-map">
      <p className="formation-peg-map__hint">
        Peg map — click a stud. Reference cells as{' '}
        <strong>letter + number</strong> (GX letter, GY number), e.g.{' '}
        <strong>A0</strong> = zero pin.
      </p>
      <p className="formation-peg-map__selection" aria-live="polite">
        Selected: <strong>{activeLabel}</strong>
        {active ? (
          <span className="formation-peg-map__raw">
            {' '}
            (gx {active.gx}, gy {active.gy})
          </span>
        ) : null}
      </p>

      <div
        className="formation-peg-map__board"
        style={{ width: BOARD_DISPLAY_W, height: BOARD_DISPLAY_H }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/Lego/Lego_Board.svg"
          alt=""
          width={BOARD_VIEWBOX.width}
          height={BOARD_VIEWBOX.height}
          className="formation-peg-map__plate"
          draggable={false}
        />

        {axisGx.map(({ gx, left, top, label }) => (
          <span
            key={`gx-${gx}`}
            className="formation-peg-map__axis formation-peg-map__axis--gx"
            style={{ left, top }}
          >
            {label}
          </span>
        ))}

        {axisGy.map(({ gy, left, top, label }) => (
          <span
            key={`gy-${gy}`}
            className="formation-peg-map__axis formation-peg-map__axis--gy"
            style={{ left, top }}
          >
            {label}
          </span>
        ))}

        {PEG_MAP.map((peg) => {
          const isOrigin = peg.gx === 0 && peg.gy === 0
          const isActive = active?.gx === peg.gx && active?.gy === peg.gy
          const { left, top } = pegScreenPosition(peg.gx, peg.gy, BOARD_DISPLAY_W)

          return (
            <button
              key={`${peg.gx}-${peg.gy}`}
              type="button"
              className={[
                'formation-peg-map__peg',
                isOrigin ? 'formation-peg-map__peg--origin' : '',
                isActive ? 'formation-peg-map__peg--active' : '',
              ]
                .filter(Boolean)
                .join(' ')}
              style={{ left, top }}
              aria-label={`Stud ${pegLabel(peg.gx, peg.gy)}`}
              aria-pressed={isActive}
              onClick={() => onPegClick(peg.gx, peg.gy)}
            >
              <span className="formation-peg-map__peg-dot" aria-hidden />
              <span className="formation-peg-map__peg-label">{pegLabel(peg.gx, peg.gy)}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
