'use client'

import {
  STICKER_SIZE_PILE,
  STICKER_SIZE_PLACED,
  stickerHeight,
} from '@/lib/stickers'

interface StickerProps {
  src: string
  alt: string
  assetId?: string
  size?: 'pile' | 'placed' | 'drag'
  rotation?: number
  elevated?: boolean
  selected?: boolean
  className?: string
  style?: React.CSSProperties
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
  const baseHeight =
    size === 'placed' || size === 'drag' ? STICKER_SIZE_PLACED : STICKER_SIZE_PILE
  const height = assetId ? stickerHeight(baseHeight, assetId) : baseHeight

  return (
    <div
      className={`sticker${elevated ? ' sticker--elevated' : ''}${selected ? ' sticker--selected' : ''} ${className}`.trim()}
      style={
        {
          '--sticker-h': `${height}px`,
          transform: `rotate(${rotation}deg)`,
          ...style,
        } as React.CSSProperties
      }
    >
      <span className="sticker__face">
        {/* eslint-disable-next-line @next/next/no-img-element */}
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
