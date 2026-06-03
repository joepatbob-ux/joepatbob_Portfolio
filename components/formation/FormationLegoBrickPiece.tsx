'use client'

import { useCallback, useState } from 'react'
import {
  brickArtSrc,
  brickDisplaySize,
  brickSelectedArtSrc,
  brickSelectedWithRotateArtSrc,
  brickSpriteViewBox,
  isPointerOnRotateRing,
  rotateRingClipPath,
  SELECTED_VIEWBOX,
  type BrickColor,
  type BrickPivot,
  type LegoBoardTheme,
} from '@/lib/formation/legoBricks'
import type { SpritePlacement } from '@/lib/formation/spritePlacement'

export type BrickHoverIntent = 'move' | 'rotate' | null

type Props = {
  id: string
  pivot: BrickPivot
  color: BrickColor
  boardTheme: LegoBoardTheme
  boardWidth: number
  isPickedUp: boolean
  placement: SpritePlacement
  /** Viewport-fixed layer (brick portal above sidebar). */
  fixed?: boolean
  isDragging: boolean
  isSelected: boolean
  isAnchored: boolean
  zIndex: number
  onPointerDown: (e: React.PointerEvent) => void
}

export function FormationLegoBrickPiece({
  id,
  pivot,
  color,
  boardTheme,
  boardWidth,
  isPickedUp,
  placement,
  fixed = false,
  isDragging,
  isSelected,
  isAnchored,
  zIndex,
  onPointerDown,
}: Props) {
  const [hoverIntent, setHoverIntent] = useState<BrickHoverIntent>(null)
  const brickViewBox = brickSpriteViewBox(isPickedUp)
  const brickSize = brickDisplaySize(boardWidth, isPickedUp)
  const artSrc = isPickedUp
    ? brickSelectedWithRotateArtSrc(pivot)
    : brickArtSrc(color, pivot, boardTheme)
  const guideSrc = brickSelectedArtSrc(pivot)
  const wRotateSrc = brickSelectedWithRotateArtSrc(pivot)

  const showHoverHints = isPickedUp && !isDragging && !isAnchored

  const updateHoverIntent = useCallback(
    (clientX: number, clientY: number) => {
      if (!showHoverHints) return
      setHoverIntent(
        isPointerOnRotateRing(clientX, clientY, placement, pivot)
          ? 'rotate'
          : 'move',
      )
    },
    [pivot, placement, showHoverHints],
  )

  const clearHoverIntent = useCallback(() => {
    setHoverIntent(null)
  }, [])

  return (
    <div
      className={[
        'formation-lego__block',
        isDragging ? 'formation-lego__piece--drag' : '',
        isSelected ? 'formation-lego__block--selected' : '',
        isAnchored ? 'formation-lego__block--anchored' : '',
        showHoverHints && hoverIntent === 'move'
          ? 'formation-lego__block--hover-move'
          : '',
        showHoverHints && hoverIntent === 'rotate'
          ? 'formation-lego__block--hover-rotate'
          : '',
        `formation-lego__block--pivot-${pivot}`,
        `formation-lego__block--color-${color}`,
      ]
        .filter(Boolean)
        .join(' ')}
      style={{
        position: fixed ? 'fixed' : 'absolute',
        left: placement.left,
        top: placement.top,
        width: placement.width,
        height: placement.height,
        zIndex,
      }}
      onPointerDown={onPointerDown}
      onPointerMove={(e) => updateHoverIntent(e.clientX, e.clientY)}
      onPointerEnter={(e) => updateHoverIntent(e.clientX, e.clientY)}
      onPointerLeave={clearHoverIntent}
      data-piece={id}
    >
      <div className="formation-lego__brick-face">
        <div
          className="formation-lego__sprite"
          style={{ width: brickSize.width, height: brickSize.height }}
        >
          <img
            src={artSrc}
            alt=""
            width={brickViewBox.width}
            height={brickViewBox.height}
            className="formation-lego__brick-img"
            draggable={false}
          />
          {showHoverHints && hoverIntent === 'rotate' ? (
            <img
              src={guideSrc}
              alt=""
              width={SELECTED_VIEWBOX.width}
              height={SELECTED_VIEWBOX.height}
              className="formation-lego__hover-guides"
              draggable={false}
            />
          ) : null}
          {showHoverHints && hoverIntent === 'move' ? (
            <img
              src={wRotateSrc}
              alt=""
              width={brickViewBox.width}
              height={brickViewBox.height}
              className="formation-lego__hover-ring-art"
              style={{ clipPath: rotateRingClipPath(pivot) }}
              draggable={false}
            />
          ) : null}
        </div>
      </div>
    </div>
  )
}
