'use client'

import {
  brickArtSrc,
  brickDisplaySize,
  type BrickColor,
  type BrickPivot,
} from '@/lib/formation/legoBricks'
import type { SpritePlacement } from '@/lib/formation/spritePlacement'

type Props = {
  id: string
  pivot: BrickPivot
  color: BrickColor
  boardWidth: number
  brickViewBox: { width: number; height: number }
  placement: SpritePlacement
  isDragging: boolean
  isSelected: boolean
  zIndex: number
  onPointerDown: (e: React.PointerEvent) => void
}

export function FormationLegoBrickPiece({
  id,
  pivot,
  color,
  boardWidth,
  brickViewBox,
  placement,
  isDragging,
  isSelected,
  zIndex,
  onPointerDown,
}: Props) {
  const brickSize = brickDisplaySize(boardWidth)

  return (
    <div
      className={[
        'formation-lego__block',
        isDragging ? 'formation-lego__piece--drag' : '',
        isSelected ? 'formation-lego__block--selected' : '',
        `formation-lego__block--pivot-${pivot}`,
        `formation-lego__block--color-${color}`,
      ]
        .filter(Boolean)
        .join(' ')}
      style={{
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
            src={brickArtSrc(color, pivot)}
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
