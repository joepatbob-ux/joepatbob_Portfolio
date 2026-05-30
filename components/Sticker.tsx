'use client'

import type { CSSProperties } from 'react'
import {
  STICKER_SIZE_PILE,
  STICKER_SIZE_PLACED,
  stickerHeight,
} from '@/lib/stickers'

type StickerSize = 'pile' | 'placed' | 'drag'

type StickerStyle = CSSProperties & {
  '--sticker-h': string
}

interface StickerProps {
  src: string
  alt: string
  assetId?: string
  size?: StickerSize
  rotation?: number
  elevated?: boolean
  selected?: boolean
  className?: string
  style?: CSSProperties
}

function baseHeightForSize(size: StickerSize): number {
  return size === 'pile' ? STICKER_SIZE_PILE : STICKER_SIZE_PLACED
}

function stickerClassName(
  elevated: boolean,
  selected: boolean,
  className: string,
): string {
  return [
    'sticker',
    elevated ? 'sticker--elevated' : '',
    selected ? 'sticker--selected' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ')
}

export function Sticker({
  src,
  alt,
  assetId,
  size = 'pile',
  rotation = 0,
  elevated = false,
  selected = false,
  className = '',
  style,
}: StickerProps) {
  const baseHeight = baseHeightForSize(size)
  const height = assetId ? stickerHeight(baseHeight, assetId) : baseHeight
  const mergedStyle: StickerStyle = {
    '--sticker-h': `${height}px`,
    transform: `rotate(${rotation}deg)`,
    ...style,
  }

  return (
    <div
      className={stickerClassName(elevated, selected, className)}
      style={mergedStyle}
    >
      <span className="sticker__face">
        <img
          src={src}
          alt={alt}
          height={height}
          draggable={false}
          className="sticker__art"
        />
      </span>
    </div>
  )
}
