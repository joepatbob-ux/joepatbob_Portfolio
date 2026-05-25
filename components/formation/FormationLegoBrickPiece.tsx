'use client'

import {
  brickArtSrc,
  brickDisplaySize,
  type BrickColor,
  type BrickPivot,
} from '@/lib/formation/legoBricks'
import type { SpritePlacement } from '@/lib/formation/spritePlacement'

type Props = {
  pivot: BrickPivot
  color: BrickColor
  boardWidth: number
  brickViewBox: { width: number; height: number }
  placement: SpritePlacement
  isDragging: boolean
  onPointerDown: (e: React.PointerEvent) => void
}

export function FormationLegoBrickPiece({
  pivot,
  color,
  boardWidth,
  brickViewBox,
  placement,
  isDragging,
  onPointerDown,
}: Props) {
  const brickSize = brickDisplaySize(boardWidth)

  return (
    <div
      className={[
        'formation-lego__block',
        isDragging ? 'formation-lego__piece--drag' : '',
        `formation-lego__block--pivot-${pivot}`,
      ]
        .filter(Boolean)
        .join(' ')}
      style={{
        left: placement.left,
        top: placement.top,
        width: placement.width,
        height: placement.height,
      }}
      onPointerDown={onPointerDown}
    >
      <div
        className="formation-lego__sprite"
        style={{ width: brickSize.width, height: brickSize.height }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
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
  )
}
