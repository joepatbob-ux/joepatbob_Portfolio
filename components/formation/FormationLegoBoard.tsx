'use client'

import { useCallback, useMemo, useRef, useState } from 'react'
import {
  BOARD_VIEWBOX,
  pegLabel,
  PEG_MAP,
  pegScreenPosition,
} from '@/lib/formation/legoGrid'
import {
  anchorFromPlacement,
  blockOriginNativeInBrick,
  blockOriginScreenPosition,
  boardDisplayHeight,
  BLOCK_ORIGIN_ABOVE_POSITION_GY,
  brickArtSrc,
  brickDisplaySize,
  brickPlacement,
  BRICK_POSITION_PIN_NATIVE,
  BRICK_VIEWBOX,
  clampBrickAnchor,
  footprintCells,
  pivotLayout,
  type BrickColor,
  type BrickPivot,
} from '@/lib/formation/legoBricks'
import '@/styles/formation-lego-board.css'

const BOARD_W = 360

/** Single-brick tuning: position pin on this peg (default C2). */
const DEFAULT_POSITION_PIN = { gx: 2, gy: 2 }
const BRICK_COLOR: BrickColor = 'cyan'

export function FormationLegoBoard() {
  const [pivot, setPivot] = useState<BrickPivot>('left')
  const [positionPin, setPositionPin] = useState(DEFAULT_POSITION_PIN)
  const [dragFree, setDragFree] = useState<{ left: number; top: number } | null>(
    null,
  )
  const [isDragging, setIsDragging] = useState(false)
  const boardRef = useRef<HTMLDivElement>(null)
  const grabOffset = useRef({ x: 0, y: 0 })

  const boardH = boardDisplayHeight(BOARD_W)
  const brickSize = brickDisplaySize(BOARD_W)

  const footprint = useMemo(
    () => footprintCells(positionPin.gx, positionPin.gy, pivot),
    [positionPin, pivot],
  )

  const blockOriginOnBoard = useMemo(
    () =>
      blockOriginScreenPosition(
        positionPin.gx,
        positionPin.gy,
        BOARD_W,
      ),
    [positionPin],
  )

  const blockOriginInBrick = useMemo(
    () => blockOriginNativeInBrick(pivot),
    [pivot],
  )

  const snappedPlace = brickPlacement(
    BOARD_W,
    positionPin.gx,
    positionPin.gy,
    pivot,
    0,
    0,
  )
  const place = dragFree
    ? { ...snappedPlace, left: dragFree.left, top: dragFree.top }
    : snappedPlace

  const layout = pivotLayout(pivot)
  const positionPegLabel = pegLabel(positionPin.gx, positionPin.gy)
  const footprintLabels = footprint.map((c) => pegLabel(c.x, c.y))

  const setPositionPinFromPeg = useCallback(
    (gx: number, gy: number) => {
      const clamped = clampBrickAnchor(gx, gy, pivot)
      setPositionPin(clamped)
      setDragFree(null)
    },
    [pivot],
  )

  const onPegClick = useCallback(
    (gx: number, gy: number) => {
      setPositionPinFromPeg(gx, gy)
    },
    [setPositionPinFromPeg],
  )

  const endDrag = useCallback(() => {
    if (!dragFree) {
      setIsDragging(false)
      return
    }
    const anchor = anchorFromPlacement(
      dragFree.left,
      dragFree.top,
      BOARD_W,
      pivot,
      0,
      0,
    )
    setPositionPinFromPeg(anchor.gx, anchor.gy)
    setIsDragging(false)
    setDragFree(null)
  }, [dragFree, pivot, setPositionPinFromPeg])

  const onBrickPointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (!boardRef.current) return
      e.stopPropagation()
      const rect = boardRef.current.getBoundingClientRect()
      grabOffset.current = {
        x: e.clientX - rect.left - place.left,
        y: e.clientY - rect.top - place.top,
      }
      setDragFree({ left: place.left, top: place.top })
      setIsDragging(true)
      boardRef.current.setPointerCapture(e.pointerId)
    },
    [place.left, place.top],
  )

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!isDragging || !boardRef.current) return
      const rect = boardRef.current.getBoundingClientRect()
      setDragFree({
        left: e.clientX - rect.left - grabOffset.current.x,
        top: e.clientY - rect.top - grabOffset.current.y,
      })
    },
    [isDragging],
  )

  const onPointerUp = useCallback(
    (e: React.PointerEvent) => {
      if (boardRef.current?.hasPointerCapture(e.pointerId)) {
        boardRef.current.releasePointerCapture(e.pointerId)
      }
      endDrag()
    },
    [endDrag],
  )

  return (
    <div className="formation-lego formation-lego--single">
      <p className="formation-lego__hint">
        Tuning <strong>one</strong> brick — cyan, {pivot} pivot.{' '}
        <strong>Click a peg</strong> to move the position pin (red stud), or drag
        the brick. Block 0,0 sits {BLOCK_ORIGIN_ABOVE_POSITION_GY} studs above
        that on +GY. Snap on release.
      </p>

      <div className="formation-lego__tuning">
        <p className="formation-lego__readout" aria-live="polite">
          Position pin: <strong>{positionPegLabel}</strong> (gx {positionPin.gx},
          gy {positionPin.gy}) · Footprint (block 0,0):{' '}
          {footprintLabels.join(', ')} · Long axis{' '}
          <strong>{layout.longAlong.toUpperCase()}</strong>
        </p>
        <div className="formation-lego__tuning-actions">
          <button
            type="button"
            className={
              pivot === 'left' ? 'formation-lego__tab--active' : 'formation-lego__tab'
            }
            onClick={() => {
              setPivot('left')
              setPositionPin((p) => clampBrickAnchor(p.gx, p.gy, 'left'))
            }}
          >
            Left pivot
          </button>
          <button
            type="button"
            className={
              pivot === 'right'
                ? 'formation-lego__tab--active'
                : 'formation-lego__tab'
            }
            onClick={() => {
              setPivot('right')
              setPositionPin((p) => clampBrickAnchor(p.gx, p.gy, 'right'))
            }}
          >
            Right pivot
          </button>
        </div>
      </div>

      <div
        ref={boardRef}
        className="formation-lego__board"
        style={{ width: BOARD_W, height: boardH }}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/Lego/Lego_Board.svg"
          alt=""
          width={BOARD_VIEWBOX.width}
          height={BOARD_VIEWBOX.height}
          className="formation-lego__baseplate"
          draggable={false}
        />

        <div className="formation-lego__debug-pegs" aria-hidden>
          {PEG_MAP.map((peg) => {
            const inFootprint = footprint.some(
              (c) => c.x === peg.gx && c.y === peg.gy,
            )
            const isPositionPin =
              peg.gx === positionPin.gx && peg.gy === positionPin.gy
            const { left, top } = pegScreenPosition(
              peg.gx,
              peg.gy,
              BOARD_W,
            )
            return (
              <button
                key={`${peg.gx}-${peg.gy}`}
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
                aria-label={`Stud ${pegLabel(peg.gx, peg.gy)}`}
                onClick={() => onPegClick(peg.gx, peg.gy)}
              />
            )
          })}
        </div>

        <span
          className="formation-lego__block-origin-marker"
          style={{
            left: blockOriginOnBoard.left,
            top: blockOriginOnBoard.top,
          }}
          aria-hidden
          title="Block 0,0 on plate"
        />

        <div
          className={[
            'formation-lego__block',
            isDragging ? 'formation-lego__piece--drag' : '',
            `formation-lego__block--pivot-${pivot}`,
          ]
            .filter(Boolean)
            .join(' ')}
          style={{
            left: place.left,
            top: place.top,
            width: place.width,
            height: place.height,
          }}
          onPointerDown={onBrickPointerDown}
        >
              <div
                className="formation-lego__sprite"
                style={{
                  width: brickSize.width,
                  height: brickSize.height,
                }}
              >
            <img
              src={brickArtSrc(BRICK_COLOR, pivot)}
              alt=""
              width={BRICK_VIEWBOX.width}
              height={BRICK_VIEWBOX.height}
              className="formation-lego__brick-img"
              draggable={false}
            />
          </div>
          <span
            className="formation-lego__pivot-marker formation-lego__pivot-marker--position"
            style={{
              left: `${(BRICK_POSITION_PIN_NATIVE[pivot].x / BRICK_VIEWBOX.width) * 100}%`,
              top: `${(BRICK_POSITION_PIN_NATIVE[pivot].y / BRICK_VIEWBOX.height) * 100}%`,
            }}
            aria-hidden
            title="Position pin"
          />
          <span
            className="formation-lego__pivot-marker formation-lego__pivot-marker--block-origin"
            style={{
              left: `${(blockOriginInBrick.x / BRICK_VIEWBOX.width) * 100}%`,
              top: `${(blockOriginInBrick.y / BRICK_VIEWBOX.height) * 100}%`,
            }}
            aria-hidden
            title="Block 0,0"
          />
        </div>
      </div>
    </div>
  )
}
