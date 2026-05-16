'use client'

import { useCallback, useEffect, useRef } from 'react'
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
    beginDragPlaced,
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

  return (
    <>
      <div
        ref={layerRef}
        className="sticker-layer"
        aria-hidden={placed.length === 0}
      >
        {placed.map((sticker) => (
          <button
            key={sticker.instanceId}
            type="button"
            className="sticker-layer__placed"
            style={{
              left: sticker.x,
              top: sticker.y,
            }}
            aria-label={`Move ${sticker.alt}`}
            onPointerDown={(e) => {
              e.preventDefault()
              beginDragPlaced(sticker.instanceId, e.clientX, e.clientY)
            }}
          >
            <Sticker
              src={sticker.src}
              alt={sticker.alt}
              assetId={sticker.assetId}
              size="placed"
              rotation={sticker.rotation}
            />
          </button>
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
