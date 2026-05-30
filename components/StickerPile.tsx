'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useChapterNav } from '@/components/ChapterNavProvider'
import { Sticker } from '@/components/Sticker'
import { STICKER_Z_BASE, useStickers } from '@/components/StickerProvider'
import { eibChapterId } from '@/lib/everything-in-between/content'
import {
  pileStackOffset,
  randomPileRotation,
  STICKER_ASSETS,
  STICKER_SIZE_PILE,
} from '@/lib/stickers'
import { useAnchorViewportRect } from '@/lib/useAnchorViewportRect'

const CONVICTION_CHAPTER_ID = eibChapterId('conviction')

export function StickerPile() {
  const { deck, deckReady, activeDrag, beginDragFromPile } = useStickers()
  const { reveals, activeSlideId } = useChapterNav()
  const rotationsRef = useRef<Map<string, number>>(new Map())
  const anchorRef = useRef<HTMLDivElement>(null)
  const anchorRect = useAnchorViewportRect(anchorRef)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

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
  const chapterReveal = reveals[CONVICTION_CHAPTER_ID] ?? 0
  const pileVisible =
    activeSlideId === CONVICTION_CHAPTER_ID && chapterReveal > 0.08

  const pileStack = (
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
                  beginDragFromPile(asset, e.clientX, e.clientY, rotation)
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
  )

  const portaledPile =
    mounted &&
    anchorRect &&
    pileVisible &&
    createPortal(
      <div
        className="sticker-pile-portal"
        style={{
          position: 'fixed',
          left: anchorRect.left,
          top: anchorRect.top,
          width: anchorRect.width,
          height: anchorRect.height,
          zIndex: STICKER_Z_BASE,
          pointerEvents: 'auto',
        }}
      >
        {pileStack}
      </div>,
      document.body,
    )

  return (
    <div
      className="sticker-pile-wrap"
      aria-hidden={!pileVisible}
      style={{
        opacity: pileVisible ? 1 : 0,
        visibility: pileVisible ? 'visible' : 'hidden',
        pointerEvents: pileVisible ? undefined : 'none',
      }}
    >
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
        ref={anchorRef}
        className="sticker-pile-anchor"
        style={{ width: pileSize, height: pileSize }}
        aria-hidden
      />
      {portaledPile}
    </div>
  )
}
