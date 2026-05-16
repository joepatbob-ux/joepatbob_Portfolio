'use client'

import { useCallback, useEffect, useRef } from 'react'
import { PlacedStickerControl } from '@/components/PlacedStickerControl'
import { Sticker } from '@/components/Sticker'
import { useStickers } from '@/components/StickerProvider'

function documentHeight(): number {
  return Math.max(
    document.documentElement.scrollHeight,
    document.body.scrollHeight,
  )
}

export function StickerLayer() {
  const {
    placed,
    activeDrag,
    selectSticker,
    moveDrag,
    endDrag,
    cancelDrag,
  } = useStickers()

  const layerRef = useRef<HTMLDivElement>(null)

  const syncLayerHeight = useCallback(() => {
    const el = layerRef.current
    if (!el) return
    el.style.height = `${documentHeight()}px`
  }, [])

  useEffect(() => {
    syncLayerHeight()
    window.addEventListener('resize', syncLayerHeight)
    const observer = new ResizeObserver(syncLayerHeight)
    observer.observe(document.body)
    observer.observe(document.documentElement)
    return () => {
      window.removeEventListener('resize', syncLayerHeight)
      observer.disconnect()
    }
  }, [syncLayerHeight, placed.length])

  useEffect(() => {
    if (!activeDrag) return

    const onPointerMove = (e: PointerEvent) => {
      moveDrag(e.clientX, e.clientY)
    }

    const onPointerUp = (e: PointerEvent) => {
      endDrag(e.pageX, e.pageY)
    }

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') cancelDrag()
    }

    window.addEventListener('pointermove', onPointerMove)
    window.addEventListener('pointerup', onPointerUp)
    window.addEventListener('keydown', onKeyDown)

    return () => {
      window.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('pointerup', onPointerUp)
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [activeDrag, moveDrag, endDrag, cancelDrag])

  useEffect(() => {
    const onPointerUp = (e: PointerEvent) => {
      const target = e.target as HTMLElement
      if (
        target.closest(
          '.sticker-placed, .sticker-pile-wrap, .sticker-pile, .sticker-layer__drag, [data-sticker-rotate]',
        )
      ) {
        return
      }
      selectSticker(null)
    }
    window.addEventListener('pointerup', onPointerUp)
    return () => window.removeEventListener('pointerup', onPointerUp)
  }, [selectSticker])

  return (
    <>
      <div
        ref={layerRef}
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
          aria-hidden
        >
          <Sticker
            src={activeDrag.asset.src}
            alt={activeDrag.asset.alt}
            assetId={activeDrag.asset.id}
            size="drag"
            rotation={activeDrag.rotation}
            elevated
          />
        </div>
      )}
    </>
  )
}
