'use client'

import { useEffect } from 'react'
import { useChapterPanelOpacity } from '@/lib/useChapterPanelOpacity'
import { useChapterStageMount } from '@/lib/hooks/useChapterStageMount'
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

interface Props {
  chapterId: string
}

export function FormationLegoBoard({ chapterId }: Props) {
  const { resolvedTheme } = useTheme()
  const { mount: stageMount } = useChapterStageMount(chapterId)
  const panel = useChapterPanelOpacity(chapterId)
  const showBoard = stageMount
  const showBricks = stageMount && (panel.opacity ?? 0) > 0.12

  const board = useFormationLegoBoard({
    syncBoardRectOnScroll: false,
    visible: showBoard && !panel.ariaHidden,
  })
  const { plate } = board

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

  const rootClass = [
    'formation-lego',
    'formation-lego--single',
    `formation-lego--theme-${resolvedTheme}`,
  ].join(' ')

  if (!stageMount) {
    return (
      <div className={rootClass}>
        <div className="formation-lego__stage">
          <div
            className="formation-lego__board formation-lego__board--clip formation-lego__board--placeholder"
            aria-hidden="true"
          />
        </div>
      </div>
    )
  }

  return (
    <div className={rootClass}>
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
            {showBricks ? (
              <div className="formation-lego__bricks-layer" aria-hidden={false}>
                <FormationBrickStack board={board} resolvedTheme={resolvedTheme} />
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  )
}
