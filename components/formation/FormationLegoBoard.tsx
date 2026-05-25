'use client'

import { BOARD_VIEWBOX } from '@/lib/formation/legoGrid'
import { alignArtSrc } from '@/lib/formation/legoBricks'
import { useFormationLegoBoard } from '@/lib/formation/useFormationLegoBoard'
import { FormationLegoBrickPiece } from '@/components/formation/FormationLegoBrickPiece'
import { FormationLegoDebugGrid } from '@/components/formation/FormationLegoDebugGrid'
import { FormationLegoTuningBar } from '@/components/formation/FormationLegoTuningBar'
import '@/styles/formation-lego-board.css'

const BRICK_COLOR = 'cyan' as const

export function FormationLegoBoard() {
  const board = useFormationLegoBoard()

  return (
    <div className="formation-lego formation-lego--single">
      <p className="formation-lego__hint">
        Tuning <strong>one</strong> brick — cyan, {board.pivot} pivot.{' '}
        <strong>Align guide</strong> (orange) shows which plate pegs the brick
        studs meet; drag the brick or click a peg to move the position pin. Snap
        on release.
      </p>

      <FormationLegoTuningBar
        pivot={board.pivot}
        positionPegLabel={board.positionPegLabel}
        positionGx={board.positionPin.gx}
        positionGy={board.positionPin.gy}
        footprintLabels={board.footprintLabels}
        longAxis={board.layout.longAlong.toUpperCase()}
        showAlignGuide={board.showAlignGuide}
        showDebugPegs={board.showDebugPegs}
        onPivotChange={board.setPivotAndClamp}
        onToggleAlignGuide={() => board.setShowAlignGuide((v) => !v)}
        onToggleDebugPegs={() => board.setShowDebugPegs((v) => !v)}
      />

      <div
        ref={board.boardRef}
        className="formation-lego__board"
        style={{ width: board.boardW, height: board.boardH }}
        onPointerMove={board.onPointerMove}
        onPointerUp={board.onPointerUp}
        onPointerCancel={board.onPointerUp}
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

        {board.showAlignGuide ? (
          <div
            className="formation-lego__align"
            style={{
              left: board.alignPlace.left,
              top: board.alignPlace.top,
              width: board.alignPlace.width,
              height: board.alignPlace.height,
            }}
            aria-hidden
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={alignArtSrc(board.pivot)}
              alt=""
              width={board.alignPlace.width}
              height={board.alignPlace.height}
              className="formation-lego__align-img"
              draggable={false}
            />
          </div>
        ) : null}

        {board.showDebugPegs ? (
          <FormationLegoDebugGrid
            boardWidth={board.boardW}
            footprint={board.footprint}
            positionPin={board.positionPin}
            onPegSelect={board.setPositionPinFromPeg}
          />
        ) : null}

        <span
          className="formation-lego__block-origin-marker"
          style={{
            left: board.blockOriginOnBoard.left,
            top: board.blockOriginOnBoard.top,
          }}
          aria-hidden
          title="Block 0,0 on plate"
        />

        <FormationLegoBrickPiece
          pivot={board.pivot}
          color={BRICK_COLOR}
          boardWidth={board.boardW}
          brickViewBox={board.brickViewBox}
          placement={board.brickPlace}
          blockOriginInBrick={board.blockOriginInBrick}
          isDragging={board.isDragging}
          showAlignGuide={board.showAlignGuide}
          onPointerDown={board.onBrickPointerDown}
        />
      </div>
    </div>
  )
}
