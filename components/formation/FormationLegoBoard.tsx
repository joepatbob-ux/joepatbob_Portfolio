'use client'

import { useEffect, useRef, useState } from 'react'
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
}: {
  board: ReturnType<typeof useFormationLegoBoard>
  resolvedTheme: ReturnType<typeof useTheme>['resolvedTheme']
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
          placement={p.placement}
          fixed={false}
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
  const panel = useChapterPanelOpacity('everything-else-formation')
  const [mounted, setMounted] = useState(false)
  const boardLatchedRef = useRef(false)
  const bricksLatchedRef = useRef(false)
  if (mounted && !panel.ariaHidden) {
    boardLatchedRef.current = true
  }
  if (mounted && !panel.ariaHidden && (panel.opacity ?? 0) > 0.12) {
    bricksLatchedRef.current = true
  }
  const showBoard = mounted && (boardLatchedRef.current || !panel.ariaHidden)
  const showBricks =
    showBoard &&
    (bricksLatchedRef.current || (panel.opacity ?? 0) > 0.12)
  /** Desktop slideshow: portal base + bricks above crossfading chapter panels. */
  const useBoardPortal = showBoard && !topBarNav

  const board = useFormationLegoBoard({
    syncBoardRectOnScroll: !topBarNav,
    visible: showBoard,
  })
  const { plate, boardRect } = board

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

  const boardPan = (
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
      {showBricks ? (
        <div className="formation-lego__bricks-layer" aria-hidden={false}>
          <FormationBrickStack board={board} resolvedTheme={resolvedTheme} />
        </div>
      ) : null}
    </div>
  )

  const interactiveBoard = (
    <div
      className="formation-lego__board formation-lego__board--clip"
      style={{ width: plate.width, height: plate.height }}
      onPointerDown={board.onBoardPointerDown}
    >
      {boardPan}
    </div>
  )

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
          className={[
            'formation-lego__board',
            'formation-lego__board--clip',
            useBoardPortal ? 'formation-lego__board--anchor' : '',
          ]
            .filter(Boolean)
            .join(' ')}
          style={{ width: plate.width, height: plate.height }}
          onPointerDown={useBoardPortal ? undefined : board.onBoardPointerDown}
          aria-hidden={useBoardPortal}
        >
          {useBoardPortal ? null : boardPan}
        </div>
      </div>

      {useBoardPortal &&
        createPortal(
          <div
            className="formation-lego__board-portal"
            style={{
              left: boardRect.left,
              top: boardRect.top,
              width: plate.width,
              height: plate.height,
              zIndex: 'var(--formation-z-bricks)',
            }}
          >
            {interactiveBoard}
          </div>,
          document.body,
        )}
    </div>
  )
}
