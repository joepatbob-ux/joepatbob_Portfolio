'use client'

import {
  alignArtSrc,
  brickArtSrc,
  brickDisplaySize,
  placementSnapAnchor,
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
  blockOriginInBrick: { x: number; y: number }
  isDragging: boolean
  showAlignGuide: boolean
  onPointerDown: (e: React.PointerEvent) => void
}

export function FormationLegoBrickPiece({
  pivot,
  color,
  boardWidth,
  brickViewBox,
  placement,
  blockOriginInBrick,
  isDragging,
  showAlignGuide,
  onPointerDown,
}: Props) {
  const brickSize = brickDisplaySize(boardWidth)
  const snapAnchor = placementSnapAnchor(pivot)

  return (
    <div
      className={[
        'formation-lego__block',
        isDragging ? 'formation-lego__piece--drag' : '',
        showAlignGuide ? 'formation-lego__block--over-align' : '',
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
      <span
        className="formation-lego__pivot-marker formation-lego__pivot-marker--position"
        style={{
          left: `${(snapAnchor.x / brickViewBox.width) * 100}%`,
          top: `${(snapAnchor.y / brickViewBox.height) * 100}%`,
        }}
        aria-hidden
        title={
          pivot === 'right'
            ? 'Block 0,0 orange (snap)'
            : 'Orange plate peg (snap)'
        }
      />
      <span
        className="formation-lego__pivot-marker formation-lego__pivot-marker--block-origin"
        style={{
          left: `${(blockOriginInBrick.x / brickViewBox.width) * 100}%`,
          top: `${(blockOriginInBrick.y / brickViewBox.height) * 100}%`,
        }}
        aria-hidden
        title="Block 0,0"
      />
    </div>
  )
}
