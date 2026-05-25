'use client'

import Image from 'next/image'
import { useCallback, useRef, useState } from 'react'
import {
  boardDisplayHeight,
  brickArtSrc,
  brickDisplaySize,
  FORMATION_ART,
  formationArtScale,
  LEGO_MM,
  type BrickColor,
  type BrickPivot,
} from '@/lib/formation/legoSpec'
import '@/styles/formation-lego-board.css'

const PLATE_STUDS = LEGO_MM.plate16.studs
const BRICK_STUD_W = LEGO_MM.brick2x4.studsLong
const BRICK_STUD_H = LEGO_MM.brick2x4.studsWide

const BOARD_DISPLAY_W = 300

type BlockDef = {
  id: string
  label: string
  color: BrickColor
}

const BLOCK_DEFS: BlockDef[] = [
  { id: 'brand', label: 'Brand', color: 'magenta' },
  { id: 'print', label: 'Print', color: 'yellow' },
  { id: 'hardware', label: 'Hardware', color: 'cyan' },
  { id: 'software', label: 'Software', color: 'black' },
]

type PieceState = {
  id: string
  sx: number
  sy: number
  pivot: BrickPivot
}

function studPoint(studX: number, studY: number, studPx: number, isoY: number) {
  return {
    x: (studX - studY) * studPx,
    y: (studX + studY) * isoY,
  }
}

function brickFootprint(
  sx: number,
  sy: number,
  studPx: number,
  isoY: number,
) {
  const corners = [
    studPoint(sx, sy, studPx, isoY),
    studPoint(sx + BRICK_STUD_W, sy, studPx, isoY),
    studPoint(sx, sy + BRICK_STUD_H, studPx, isoY),
    studPoint(sx + BRICK_STUD_W, sy + BRICK_STUD_H, studPx, isoY),
  ]
  const xs = corners.map((p) => p.x)
  const ys = corners.map((p) => p.y)
  return {
    left: Math.min(...xs),
    top: Math.min(...ys),
    width: Math.max(...xs) - Math.min(...xs),
    height: Math.max(...ys) - Math.min(...ys),
  }
}

function sortKey(p: PieceState) {
  return p.sx + p.sy + BRICK_STUD_W + BRICK_STUD_H
}

const INITIAL: PieceState[] = [
  { id: 'brand', sx: 0, sy: 4, pivot: 'left' },
  { id: 'print', sx: 10, sy: 0, pivot: 'right' },
  { id: 'hardware', sx: 0, sy: 10, pivot: 'left' },
  { id: 'software', sx: 8, sy: 6, pivot: 'left' },
]

export function FormationLegoBoard() {
  const [pieces, setPieces] = useState<PieceState[]>(INITIAL)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [dragId, setDragId] = useState<string | null>(null)
  const boardRef = useRef<HTMLDivElement>(null)
  const dragOffset = useRef({ x: 0, y: 0 })

  const boardW = BOARD_DISPLAY_W
  const boardH = boardDisplayHeight(boardW)
  const studPx = boardW / PLATE_STUDS
  const isoY = studPx * 0.55
  const brickSize = brickDisplaySize(boardW)

  const flipPivot = useCallback((id: string) => {
    setPieces((prev) =>
      prev.map((p) =>
        p.id === id ? { ...p, pivot: p.pivot === 'left' ? 'right' : 'left' } : p,
      ),
    )
  }, [])

  const onBoardPointerDown = useCallback((e: React.PointerEvent) => {
    const target = e.target as HTMLElement
    if (target.closest('.formation-lego__block')) return
    setSelectedId(null)
  }, [])

  const onPointerDown = useCallback(
    (e: React.PointerEvent, id: string) => {
      e.stopPropagation()
      setSelectedId(id)
      const board = boardRef.current
      if (!board) return
      const piece = pieces.find((p) => p.id === id)
      if (!piece) return
      const box = brickFootprint(piece.sx, piece.sy, studPx, isoY)
      const rect = board.getBoundingClientRect()
      dragOffset.current = {
        x: e.clientX - rect.left - box.left,
        y: e.clientY - rect.top - box.top,
      }
      setDragId(id)
      ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
    },
    [pieces, studPx, isoY],
  )

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!dragId || !boardRef.current) return
      const piece = pieces.find((p) => p.id === dragId)
      if (!piece) return
      const rect = boardRef.current.getBoundingClientRect()
      const localX = e.clientX - rect.left - dragOffset.current.x
      const localY = e.clientY - rect.top - dragOffset.current.y
      const sx = Math.round((localX / studPx + localY / isoY) / 2)
      const sy = Math.round((localY / isoY - localX / studPx) / 2)
      setPieces((prev) =>
        prev.map((p) =>
          p.id === dragId
            ? {
                ...p,
                sx: Math.max(0, Math.min(PLATE_STUDS - BRICK_STUD_W, sx)),
                sy: Math.max(0, Math.min(PLATE_STUDS - BRICK_STUD_H, sy)),
              }
            : p,
        ),
      )
    },
    [dragId, pieces, studPx, isoY],
  )

  const onPointerUp = useCallback(() => {
    setDragId(null)
  }, [])

  const sorted = [...pieces].sort((a, b) => sortKey(a) - sortKey(b))
  const renderOrder =
    dragId != null
      ? [...sorted.filter((p) => p.id !== dragId), pieces.find((p) => p.id === dragId)!]
      : sorted

  return (
    <div className="formation-lego">
      <div
        ref={boardRef}
        className="formation-lego__board"
        style={{ width: boardW, height: boardH }}
        onPointerDown={onBoardPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
      >
        <Image
          src="/images/formation/board.png"
          alt=""
          width={FORMATION_ART.board.width}
          height={FORMATION_ART.board.height}
          className="formation-lego__baseplate"
          style={{ width: boardW, height: boardH }}
          draggable={false}
          priority
        />

        {renderOrder.map((piece) => {
          const def = BLOCK_DEFS.find((b) => b.id === piece.id)
          if (!def) return null

          const box = brickFootprint(piece.sx, piece.sy, studPx, isoY)
          const isDragging = dragId === piece.id
          const isSelected = selectedId === piece.id && !isDragging
          const showRing = isSelected

          return (
            <div
              key={piece.id}
              className={[
                'formation-lego__block',
                isSelected ? 'formation-lego__block--selected' : '',
                isDragging ? 'formation-lego__piece--drag' : '',
              ]
                .filter(Boolean)
                .join(' ')}
              style={{
                left: box.left,
                top: box.top,
                width: box.width,
                height: box.height,
              }}
              onPointerDown={(e) => onPointerDown(e, piece.id)}
            >
              <div
                className={[
                  'formation-lego__brick-sprite',
                  `formation-lego__brick-sprite--${piece.pivot}`,
                  showRing
                    ? 'formation-lego__brick-sprite--ring'
                    : 'formation-lego__brick-sprite--placed',
                ]
                  .filter(Boolean)
                  .join(' ')}
                style={{ width: brickSize.width, height: brickSize.height }}
              >
                <Image
                  src={brickArtSrc(def.color, piece.pivot)}
                  alt=""
                  width={FORMATION_ART.brick.width}
                  height={FORMATION_ART.brick.height}
                  className="formation-lego__brick-img"
                  draggable={false}
                />
              </div>
              {showRing ? (
                <button
                  type="button"
                  className={[
                    'formation-lego__flip-hit',
                    `formation-lego__flip-hit--${piece.pivot}`,
                  ].join(' ')}
                  aria-label={`Flip ${def.label} block`}
                  onClick={(e) => {
                    e.stopPropagation()
                    flipPivot(piece.id)
                  }}
                  onPointerDown={(e) => e.stopPropagation()}
                />
              ) : null}
            </div>
          )
        })}
      </div>
    </div>
  )
}
