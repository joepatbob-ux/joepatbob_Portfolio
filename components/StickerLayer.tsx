'use client'

import { useCallback, useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { PlacedStickerControl } from '@/components/PlacedStickerControl'
import { Sticker } from '@/components/Sticker'
import { useStickers } from '@/components/StickerProvider'
import { bindStickerLayerElement } from '@/lib/stickerScroll'
import { stickerInstanceAtPoint } from '@/lib/stickerHitTest'
import { flushScrollFrame } from '@/lib/scrollFrame'

export function StickerLayer() {
  const { placed, activeDrag, selectSticker, dispatchPlacedPointer } =
    useStickers()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const onLayerRef = useCallback((el: HTMLDivElement | null) => {
    bindStickerLayerElement(el)
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
        target.closest('.sticker-pile-wrap, .sticker-pile, .sticker-layer__drag')
      ) {
        return
      }

      const placedRoot = target.closest(
        '[data-sticker-instance]',
      ) as HTMLElement | null
      const instanceId =
        placedRoot?.dataset.stickerInstance ??
        stickerInstanceAtPoint(e.clientX, e.clientY)
      if (instanceId) {
        dispatchPlacedPointer(instanceId, e)
        e.stopPropagation()
        return
      }

      selectSticker(null)
    }
    window.addEventListener('pointerdown', onPointerDown, true)
    return () => window.removeEventListener('pointerdown', onPointerDown, true)
  }, [selectSticker, activeDrag, dispatchPlacedPointer])

  if (!mounted) return null

  return createPortal(
    <>
      <div
        ref={onLayerRef}
        className="sticker-layer"
        aria-hidden={placed.length === 0}
      >
        {placed.map((sticker) => (
          <PlacedStickerControl key={sticker.instanceId} sticker={sticker} />
        ))}
      </div>

      {activeDrag && (
        <div
          className="sticker-layer__drag"
          style={{
            left: activeDrag.clientX,
            top: activeDrag.clientY,
          }}
        >
          <Sticker
            src={activeDrag.asset.src}
            alt={activeDrag.asset.alt}
            assetId={activeDrag.asset.id}
            size="placed"
            rotation={activeDrag.rotation}
          />
        </div>
      )}
    </>,
    document.body,
  )
}
