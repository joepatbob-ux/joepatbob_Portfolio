'use client'

import { BOARD_VIEWBOX } from '@/lib/formation/legoGrid'
import { useFormationLegoBoard } from '@/lib/formation/useFormationLegoBoard'
import { FormationLegoBrickPiece } from '@/components/formation/FormationLegoBrickPiece'
import { FormationLegoIsoPegOverlay } from '@/components/formation/FormationLegoIsoPegOverlay'
import { FormationLegoTopDownGrid } from '@/components/formation/FormationLegoTopDownGrid'
import '@/styles/formation-lego-board.css'

const BRICK_COLOR = 'cyan' as const

function tabClass(active: boolean): string {
  return active ? 'formation-lego__tab--active' : 'formation-lego__tab'
}

export function FormationLegoBoard() {
  const board = useFormationLegoBoard()
  const { plate } = board

  return (
    <div className="formation-lego formation-lego--single">
      <div className="formation-lego__controls">
        <button
          type="button"
          className={tabClass(board.pivot === 'left')}
          onClick={() => board.setPivotAndClamp('left')}
        >
          Left pivot
        </button>
        <button
          type="button"
          className={tabClass(board.pivot === 'right')}
          onClick={() => board.setPivotAndClamp('right')}
        >
          Right pivot
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

            <FormationLegoIsoPegOverlay
              boardDisplayW={board.boardW}
              pivot={board.pivot}
              positionPin={board.positionPin}
            />

            <FormationLegoBrickPiece
              pivot={board.pivot}
              color={BRICK_COLOR}
              boardWidth={board.boardW}
              brickViewBox={board.brickViewBox}
              placement={board.brickPlace}
              isDragging={board.isDragging}
              onPointerDown={board.onBrickPointerDown}
            />
          </div>
        </div>

        <FormationLegoTopDownGrid
          pivot={board.pivot}
          isoPositionPin={board.positionPin}
          boardDisplayW={board.boardW}
          brickPlacementScreen={{
            left: board.brickPlace.left,
            top: board.brickPlace.top,
          }}
          isDragging={board.isDragging}
        />
      </div>
    </div>
  )
}
