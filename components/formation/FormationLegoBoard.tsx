'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { useChapterPanelOpacity } from '@/lib/useChapterPanelOpacity'
import { useTheme } from '@/components/ThemeProvider'
import { BOARD_VIEWBOX } from '@/lib/formation/legoGrid'
import { useFormationLegoBoard } from '@/lib/formation/useFormationLegoBoard'
import { FormationLegoBrickPiece } from '@/components/formation/FormationLegoBrickPiece'
import {
  BRICK_Z_INDEX_SELECT_BOOST,
  FORMATION_Z_BRICKS,
  legoBoardSrc,
} from '@/lib/formation/legoBricks'
import '@/styles/formation-lego-board.css'

export function FormationLegoBoard() {
  const { resolvedTheme } = useTheme()
  const board = useFormationLegoBoard()
  const { plate } = board
  const panel = useChapterPanelOpacity('everything-else-formation')
  const [mounted, setMounted] = useState(false)
  const showBricks = mounted && panel.isActive

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!showBricks || board.activeId == null) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'r' && e.key !== 'R') return
      if (e.metaKey || e.ctrlKey || e.altKey) return
      const target = e.target as HTMLElement | null
      if (
        target?.closest('input, textarea, select, [contenteditable="true"]')
      ) {
        return
      }
      e.preventDefault()
      board.toggleActivePivot()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [board.activeId, board.toggleActivePivot, showBricks])

  return (
    <div
      className={[
        'formation-lego',
        'formation-lego--single',
        `formation-lego--theme-${resolvedTheme}`,
      ].join(' ')}
    >
      <div ref={board.stageRef} className="formation-lego__stage">
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
            <img
              src={legoBoardSrc(resolvedTheme)}
              alt=""
              width={BOARD_VIEWBOX.width}
              height={BOARD_VIEWBOX.height}
              className="formation-lego__baseplate"
              draggable={false}
            />
          </div>
        </div>
      </div>

      {showBricks &&
        createPortal(
          <div
            className="formation-lego__bricks-portal"
            style={{ zIndex: FORMATION_Z_BRICKS }}
          >
            {board.pieces.map((p) => (
              <FormationLegoBrickPiece
                key={p.id}
                id={p.id}
                pivot={p.pivot}
                color={p.color}
                boardTheme={resolvedTheme}
                boardWidth={board.boardW}
                isPickedUp={board.isPiecePickedUp(p.id)}
                placement={p.screenPlacement}
                fixed
                isDragging={board.draggingId === p.id && board.isDragging}
                isSelected={board.activeId === p.id && !p.isAnchored}
                isAnchored={p.isAnchored}
                zIndex={
                  p.z +
                  (board.activeId === p.id && !p.isAnchored
                    ? BRICK_Z_INDEX_SELECT_BOOST
                    : 0)
                }
                onPointerDown={board.onBrickPointerDown(p.id)}
              />
            ))}
          </div>,
          document.body,
        )}
    </div>
  )
}
