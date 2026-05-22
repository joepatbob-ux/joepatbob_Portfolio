'use client'

import { useCallback, useRef } from 'react'
import { Sticker } from '@/components/Sticker'
import { useStickers } from '@/components/StickerProvider'
import {
  pileStackOffset,
  randomPileRotation,
  STICKER_ASSETS,
  STICKER_SIZE_PILE,
} from '@/lib/stickers'

export function StickerPile() {
  const { deck, deckReady, activeDrag, beginDragFromPile } = useStickers()
  const rotationsRef = useRef<Map<string, number>>(new Map())

  const visible = deck
  const top = visible[0]

  const rotationFor = useCallback((id: string) => {
    const cached = rotationsRef.current.get(id)
    if (cached !== undefined) return cached
    const rotation = randomPileRotation()
    rotationsRef.current.set(id, rotation)
    return rotation
  }, [])

  visible.forEach((asset) => {
    rotationFor(asset.id)
  })

  const isDraggingTop =
    activeDrag?.fromPile && top && activeDrag.asset.id === top.id
  const pileCards = isDraggingTop ? visible.slice(1) : visible

  const pileSize = STICKER_SIZE_PILE + 48

  return (
    <div className="sticker-pile-wrap">
      <p className="sticker-pile__label">Launch swag — grab one</p>
      <p className="sticker-pile__hint">
        Random stack — grab from the top down, one at a time. Tap a placed sticker to
        select; drag the ring or dot to rotate.
        {deck.length > 0 && (
          <span className="sticker-pile__count">
            {deck.length} of {STICKER_ASSETS.length} left
          </span>
        )}
      </p>

      <div
        className="sticker-pile"
        style={{ width: pileSize, height: pileSize }}
        aria-label="Sticker stack"
      >
        {!deckReady ? null : pileCards.length === 0 ? (
          <p className="sticker-pile__empty">Stack&apos;s empty — refresh to restock.</p>
        ) : (
          [...pileCards].reverse().map((asset, reverseIndex) => {
            const indexFromTop = pileCards.length - 1 - reverseIndex
            const isTop = indexFromTop === 0
            const layout = pileStackOffset(indexFromTop, pileCards.length)
            const rotation = rotationFor(asset.id)

            const cardClass = `sticker-pile__card${
              isTop ? ' sticker-pile__card--top' : ' sticker-pile__card--under'
            }`

            const cardStyle = {
              zIndex: pileCards.length - indexFromTop,
              ['--stack-x' as string]: `${layout.x}px`,
              ['--stack-y' as string]: `${layout.y}px`,
            }

            if (isTop) {
              return (
                <button
                  key={asset.id}
                  type="button"
                  className={cardClass}
                  style={cardStyle}
                  disabled={Boolean(activeDrag)}
                  aria-label={`Pick up ${asset.alt}`}
                  onPointerDown={(e) => {
                    if (e.button !== 0) return
                    beginDragFromPile(
                      asset,
                      e.clientX,
                      e.clientY,
                      rotation,
                    )
                  }}
                  onClick={(e) => e.preventDefault()}
                >
                  <Sticker
                    src={asset.src}
                    alt={asset.alt}
                    assetId={asset.id}
                    rotation={rotation}
                    elevated
                  />
                </button>
              )
            }

            return (
              <div
                key={asset.id}
                className={cardClass}
                style={cardStyle}
                aria-hidden
              >
                <Sticker
                  src={asset.src}
                  alt=""
                  assetId={asset.id}
                  rotation={rotation}
                />
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
