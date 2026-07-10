import type { CSSProperties } from 'react'
import { stickerHeight } from '@/lib/stickers'
import { useStickers } from '@/components/StickerProvider'

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

function baseHeightForSize(
  size: StickerSize,
  heights: { pile: number; placed: number },
): number {
  // The drag ghost keeps the pile size — growing mid-air on pickup reads as
  // a glitch. It settles to the placed size when actually stuck down.
  return size === 'placed' ? heights.placed : heights.pile
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
  const { stickerHeights: heights } = useStickers()
  const baseHeight = baseHeightForSize(size, heights)
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
          width={height}
          height={height}
          loading="lazy"
          draggable={false}
          className="sticker__art"
        />
      </span>
    </div>
  )
}
