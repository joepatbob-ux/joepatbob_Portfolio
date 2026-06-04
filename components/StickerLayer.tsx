'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { PlacedStickerControl } from '@/components/PlacedStickerControl'
import { Sticker } from '@/components/Sticker'
import { useStickers } from '@/components/StickerProvider'
import { flushScrollFrame } from '@/lib/scrollFrame'

export function StickerLayer() {
  const { placed, activeDrag, selectSticker, zIndices } = useStickers()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return
    flushScrollFrame()
  }, [mounted, placed.length])

  useEffect(() => {
    const onPointerDown = (e: PointerEvent) => {
      if (activeDrag) return
      const target = e.target as HTMLElement
      if (
        target.closest(
          '.sticker-pile-wrap, .sticker-pile-portal, .sticker-pile, .sticker-pile__grab, .sticker-layer__drag, .sticker-placed, .sticker-placed__hit, .sticker-placed__scrubber-hit',
        )
      ) {
        return
      }
      selectSticker(null)
    }
    window.addEventListener('pointerdown', onPointerDown, true)
    return () => window.removeEventListener('pointerdown', onPointerDown, true)
  }, [selectSticker, activeDrag])

  if (!mounted) return null

  return (
    <>
      {createPortal(
        <div
          className="sticker-layer"
          aria-hidden={placed.length === 0 && !activeDrag}
        >
          {placed.map((sticker) => (
            <PlacedStickerControl key={sticker.instanceId} sticker={sticker} />
          ))}
        </div>,
        document.body,
      )}

      {activeDrag &&
        createPortal(
          <div
            className="sticker-layer__drag"
            style={{
              left: activeDrag.clientX,
              top: activeDrag.clientY,
              zIndex: zIndices.drag,
            }}
          >
            <Sticker
              src={activeDrag.asset.src}
              alt={activeDrag.asset.alt}
              assetId={activeDrag.asset.id}
              size="placed"
              rotation={activeDrag.rotation}
              elevated
            />
          </div>,
          document.body,
        )}
    </>
  )
}
