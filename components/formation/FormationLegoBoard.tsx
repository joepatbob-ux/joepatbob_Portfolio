'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { useChapterPanelOpacity } from '@/lib/useChapterPanelOpacity'
import { useLayoutTopBarNav } from '@/lib/hooks/useLayoutTopBarNav'
import { useTheme } from '@/components/ThemeProvider'
import { BOARD_VIEWBOX } from '@/lib/formation/legoGrid'
import { useFormationLegoBoard } from '@/lib/formation/useFormationLegoBoard'
import { FormationLegoBrickPiece } from '@/components/formation/FormationLegoBrickPiece'
import { BRICK_Z_INDEX_SELECT_BOOST, legoBoardSrc } from '@/lib/formation/legoBricks'
import '@/styles/formation-lego-board.css'

function FormationBrickStack({
  board,
  resolvedTheme,
  portal,
}: {
  board: ReturnType<typeof useFormationLegoBoard>
  resolvedTheme: ReturnType<typeof useTheme>['resolvedTheme']
  portal: boolean
}) {
  return (
    <>
      {board.pieces.map((p) => (
        <FormationLegoBrickPiece
          key={p.id}
          id={p.id}
          pivot={p.pivot}
          color={p.color}
          boardTheme={resolvedTheme}
          boardWidth={board.boardW}
          isPickedUp={board.isPiecePickedUp(p.id)}
          placement={portal ? p.screenPlacement : p.placement}
          fixed={portal}
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
    </>
  )
}

export function FormationLegoBoard() {
  const { resolvedTheme } = useTheme()
  const topBarNav = useLayoutTopBarNav()
  const board = useFormationLegoBoard({ syncBoardRectOnScroll: !topBarNav })
  const { plate } = board
  const panel = useChapterPanelOpacity('everything-else-formation')
  const [mounted, setMounted] = useState(false)
  const showBricks = mounted && panel.isActive
  /** Inline bricks on touch-width layouts; portal only on desktop sidebar shell. */
  const useBrickPortal = showBricks && !topBarNav

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
            {showBricks && topBarNav ? (
              <div className="formation-lego__bricks-layer" aria-hidden={false}>
                <FormationBrickStack
                  board={board}
                  resolvedTheme={resolvedTheme}
                  portal={false}
                />
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {useBrickPortal &&
        createPortal(
          <div
            className="formation-lego__bricks-portal"
            style={{ zIndex: 'var(--formation-z-bricks)' }}
          >
            <FormationBrickStack
              board={board}
              resolvedTheme={resolvedTheme}
              portal
            />
          </div>,
          document.body,
        )}
    </div>
  )
}
