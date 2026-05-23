'use client'

import { useCallback, useRef, useState } from 'react'
import '@/styles/formation-lego-board.css'

const GRID = 8
const STUD = 14

type Orientation = 'h' | 'v'

type BlockDef = {
  id: string
  label: string
  color: string
  w: number
  h: number
}

const BLOCK_DEFS: BlockDef[] = [
  { id: 'brand', label: 'Brand', color: '#c41e3a', w: 4, h: 2 },
  { id: 'print', label: 'Print', color: '#f4d03f', w: 4, h: 2 },
  { id: 'hardware', label: 'Hardware', color: '#2980b9', w: 4, h: 2 },
  { id: 'software', label: 'Software', color: '#8e44ad', w: 4, h: 2 },
]

type PieceState = {
  id: string
  gx: number
  gy: number
  orientation: Orientation
  kind: 'block' | 'minifig'
}

function isoPoint(gx: number, gy: number) {
  return {
    x: (gx - gy) * STUD,
    y: (gx + gy) * (STUD * 0.55),
  }
}

function pieceSize(p: PieceState, def?: BlockDef) {
  if (p.kind === 'minifig') return { w: 1, h: 1 }
  const base = def ?? BLOCK_DEFS[0]
  const w = p.orientation === 'h' ? base.w : base.h
  const h = p.orientation === 'h' ? base.h : base.w
  return { w, h }
}

function sortKey(p: PieceState) {
  const { w, h } = pieceSize(
    p,
    BLOCK_DEFS.find((b) => b.id === p.id),
  )
  return p.gx + p.gy + w + h
}

const INITIAL: PieceState[] = [
  { id: 'brand', gx: 0, gy: 2, orientation: 'h', kind: 'block' },
  { id: 'print', gx: 4, gy: 0, orientation: 'v', kind: 'block' },
  { id: 'hardware', gx: 2, gy: 4, orientation: 'h', kind: 'block' },
  { id: 'software', gx: 5, gy: 3, orientation: 'h', kind: 'block' },
  { id: 'jpr', gx: 3, gy: 6, orientation: 'h', kind: 'minifig' },
]

export function FormationLegoBoard() {
  const [pieces, setPieces] = useState<PieceState[]>(INITIAL)
  const [dragId, setDragId] = useState<string | null>(null)
  const [hoverId, setHoverId] = useState<string | null>(null)
  const boardRef = useRef<HTMLDivElement>(null)
  const dragOffset = useRef({ x: 0, y: 0 })

  const rotatePiece = useCallback((id: string) => {
    setPieces((prev) =>
      prev.map((p) =>
        p.id === id && p.kind === 'block'
          ? {
              ...p,
              orientation: p.orientation === 'h' ? 'v' : 'h',
            }
          : p,
      ),
    )
  }, [])

  const onPointerDown = useCallback(
    (e: React.PointerEvent, id: string) => {
      const board = boardRef.current
      if (!board) return
      const piece = pieces.find((p) => p.id === id)
      if (!piece) return
      const rect = board.getBoundingClientRect()
      const origin = isoPoint(piece.gx, piece.gy)
      dragOffset.current = {
        x: e.clientX - rect.left - origin.x,
        y: e.clientY - rect.top - origin.y,
      }
      setDragId(id)
      ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
    },
    [pieces],
  )

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!dragId || !boardRef.current) return
      const rect = boardRef.current.getBoundingClientRect()
      const localX = e.clientX - rect.left - dragOffset.current.x
      const localY = e.clientY - rect.top - dragOffset.current.y
      const gx = Math.round(
        (localX / STUD + localY / (STUD * 0.55)) / 2,
      )
      const gy = Math.round(
        (localY / (STUD * 0.55) - localX / STUD) / 2,
      )
      const clampedGx = Math.max(0, Math.min(GRID - 1, gx))
      const clampedGy = Math.max(0, Math.min(GRID - 1, gy))
      setPieces((prev) =>
        prev.map((p) =>
          p.id === dragId ? { ...p, gx: clampedGx, gy: clampedGy } : p,
        ),
      )
    },
    [dragId],
  )

  const onPointerUp = useCallback(() => {
    setDragId(null)
  }, [])

  const sorted = [...pieces].sort((a, b) => sortKey(a) - sortKey(b))
  const renderOrder =
    dragId != null
      ? [...sorted.filter((p) => p.id !== dragId), pieces.find((p) => p.id === dragId)!]
      : sorted

  const boardW = GRID * STUD * 2
  const boardH = GRID * STUD * 1.2

  return (
    <div className="formation-lego">
      <div
        ref={boardRef}
        className="formation-lego__board"
        style={{ width: boardW, height: boardH }}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
      >
        <div
          className="formation-lego__baseplate"
          aria-hidden
          style={{
            width: boardW,
            height: boardH,
          }}
        >
          {Array.from({ length: GRID * GRID }, (_, i) => {
            const gx = i % GRID
            const gy = Math.floor(i / GRID)
            const { x, y } = isoPoint(gx, gy)
            return (
              <span
                key={`${gx}-${gy}`}
                className="formation-lego__stud"
                style={{ left: x, top: y }}
              />
            )
          })}
        </div>

        {renderOrder.map((piece) => {
          const def = BLOCK_DEFS.find((b) => b.id === piece.id)
          const { w, h } = pieceSize(piece, def)
          const { x, y } = isoPoint(piece.gx, piece.gy)
          const isDragging = dragId === piece.id
          const isHover = hoverId === piece.id

          if (piece.kind === 'minifig') {
            return (
              <div
                key={piece.id}
                className={[
                  'formation-lego__minifig',
                  isDragging ? 'formation-lego__piece--drag' : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
                style={{ left: x, top: y }}
                onPointerDown={(e) => onPointerDown(e, piece.id)}
                onPointerEnter={() => setHoverId(piece.id)}
                onPointerLeave={() => setHoverId(null)}
                role="img"
                aria-label="J.P.R. minifigure"
              >
                <div className="formation-lego__minifig-hair" />
                <div className="formation-lego__minifig-head">
                  <span className="formation-lego__eye formation-lego__eye--l" />
                  <span className="formation-lego__eye formation-lego__eye--r" />
                  <svg
                    className="formation-lego__smile"
                    viewBox="0 0 20 8"
                    aria-hidden
                  >
                    <path
                      d="M3 2 Q10 10 17 2"
                      fill="none"
                      stroke="#1a1a1a"
                      strokeWidth="1.2"
                    />
                  </svg>
                </div>
                <div className="formation-lego__minifig-torso" />
                <div className="formation-lego__minifig-legs" />
              </div>
            )
          }

          if (!def) return null
          const blockW = w * STUD
          const blockH = h * STUD * 0.55

          return (
            <div
              key={piece.id}
              className={[
                'formation-lego__block',
                isDragging ? 'formation-lego__piece--drag' : '',
              ]
                .filter(Boolean)
                .join(' ')}
              style={{
                left: x,
                top: y,
                width: blockW,
                height: blockH,
                backgroundColor: def.color,
              }}
              onPointerDown={(e) => onPointerDown(e, piece.id)}
              onPointerEnter={() => setHoverId(piece.id)}
              onPointerLeave={() => setHoverId(null)}
            >
              <span className="formation-lego__block-label">{def.label}</span>
              {isHover && !isDragging ? (
                <button
                  type="button"
                  className="formation-lego__rotate"
                  aria-label={`Rotate ${def.label} block`}
                  onClick={(e) => {
                    e.stopPropagation()
                    rotatePiece(piece.id)
                  }}
                >
                  ↻
                </button>
              ) : null}
            </div>
          )
        })}
      </div>

      <ul className="formation-lego__legend" aria-label="Block legend">
        {BLOCK_DEFS.map((b) => (
          <li key={b.id}>
            <span
              className="formation-lego__swatch"
              style={{ backgroundColor: b.color }}
            />
            {b.label}
          </li>
        ))}
        <li>
          <span className="formation-lego__swatch formation-lego__swatch--jpr" />
          J.P.R.
        </li>
      </ul>
    </div>
  )
}
