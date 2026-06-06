'use client'

import {
  brickArtSrc,
  brickDisplaySize,
  brickSelectedWithRotateArtSrc,
  brickSpriteViewBox,
  type BrickColor,
  type BrickPivot,
  type LegoBoardTheme,
} from '@/lib/formation/legoBricks'
import type { SpritePlacement } from '@/lib/formation/spritePlacement'

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
  const brickViewBox = brickSpriteViewBox(isPickedUp)
  const brickSize = brickDisplaySize(boardWidth, isPickedUp)
  const artSrc = isPickedUp
    ? brickSelectedWithRotateArtSrc(pivot)
    : brickArtSrc(color, pivot, boardTheme)

  return (
    <div
      className={[
        'formation-lego__block',
        isDragging ? 'formation-lego__piece--drag' : '',
        isSelected ? 'formation-lego__block--selected' : '',
        isAnchored ? 'formation-lego__block--anchored' : '',
        isPickedUp && !isDragging && !isAnchored
          ? 'formation-lego__block--picked-up'
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
        </div>
      </div>
    </div>
  )
}
