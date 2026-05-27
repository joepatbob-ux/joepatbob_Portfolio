'use client'

import { BOARD_VIEWBOX } from '@/lib/formation/legoGrid'
import {
  FORMATION_BRICK_COLORS,
  useFormationLegoBoard,
} from '@/lib/formation/useFormationLegoBoard'
import { FormationLegoBrickPiece } from '@/components/formation/FormationLegoBrickPiece'
import {
  BRICK_Z_INDEX_DRAG_BOOST,
  BRICK_Z_INDEX_SELECT_BOOST,
  type BrickColor,
} from '@/lib/formation/legoBricks'
import '@/styles/formation-lego-board.css'

function tabClass(active: boolean): string {
  return active ? 'formation-lego__tab--active' : 'formation-lego__tab'
}

const COLOR_LABEL: Record<BrickColor, string> = {
  cyan: 'Cyan',
  magenta: 'Magenta',
  yellow: 'Yellow',
  black: 'Black',
}

export function FormationLegoBoard() {
  const board = useFormationLegoBoard()
  const { plate } = board

  return (
    <div className="formation-lego formation-lego--single">
      <div className="formation-lego__controls">
        <span className="formation-lego__controls-label">Active block</span>
        {FORMATION_BRICK_COLORS.map((color) => (
          <button
            key={color}
            type="button"
            className={[
              'formation-lego__color-tab',
              `formation-lego__color-tab--${color}`,
              board.activeId === color ? 'formation-lego__color-tab--active' : '',
            ]
              .filter(Boolean)
              .join(' ')}
            onClick={() => board.setActiveId(color)}
          >
            {COLOR_LABEL[color]}
          </button>
        ))}
        <span className="formation-lego__controls-divider" aria-hidden />
        <button
          type="button"
          className={tabClass(board.activePivot === 'left')}
          disabled={!board.activeId}
          onClick={() => board.rotateActivePiece('left')}
        >
          Rotate left
        </button>
        <button
          type="button"
          className={tabClass(board.activePivot === 'right')}
          disabled={!board.activeId}
          onClick={() => board.rotateActivePiece('right')}
        >
          Rotate right
        </button>
      </div>

      <div className="formation-lego__stage">
        <div
          ref={board.boardRef}
          className="formation-lego__board formation-lego__board--clip"
          style={{ width: plate.width, height: plate.height }}
          onPointerDown={board.onBoardPointerDown}
          onPointerMove={board.onPointerMove}
          onPointerUp={board.onPointerUp}
          onPointerCancel={board.onPointerUp}
        >
          <div
            className="formation-lego__board-pan"
            style={{
              width: plate.fullWidth,
              height: plate.fullHeight,
              transform: `translate(${plate.panX}px, ${plate.panY}px)`,
            }}
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

            {board.pieces.map((p) => (
              <FormationLegoBrickPiece
                key={p.id}
                id={p.id}
                pivot={p.pivot}
                color={p.color}
                boardWidth={board.boardW}
                brickViewBox={board.brickViewBox}
                placement={p.placement}
                isDragging={board.draggingId === p.id && board.isDragging}
                isSelected={board.activeId === p.id}
                zIndex={
                  p.z +
                  (board.draggingId === p.id && board.isDragging
                    ? BRICK_Z_INDEX_DRAG_BOOST
                    : 0) +
                  (board.activeId === p.id &&
                  !(board.draggingId === p.id && board.isDragging)
                    ? BRICK_Z_INDEX_SELECT_BOOST
                    : 0)
                }
                onPointerDown={board.onBrickPointerDown(p.id)}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
