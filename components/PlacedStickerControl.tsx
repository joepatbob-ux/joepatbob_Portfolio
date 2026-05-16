'use client'

import { useLayoutEffect, useRef, useState } from 'react'
import { Sticker } from '@/components/Sticker'
import type { PlacedSticker } from '@/components/StickerProvider'
import { useStickers } from '@/components/StickerProvider'
import { STICKER_SIZE_PLACED, stickerHeight } from '@/lib/stickers'

const MOVE_THRESHOLD = 8
/** Track circle radius: sticker circumradius + this offset (px). */
const TRACK_GAP_PX = 8
const TRACK_STROKE_PX = 16
const SCRUBBER_R_PX = 14
const SCRUBBER_CENTER_R_PX = 5
const SCRUBBER_HIT_R_PX = 28

function angleFromCenter(cx: number, cy: number, px: number, py: number): number {
  return (Math.atan2(py - cy, px - cx) * 180) / Math.PI
}

interface LockedRing {
  ringSize: number
  trackR: number
  cx: number
  cy: number
}

interface Props {
  sticker: PlacedSticker
}

export function PlacedStickerControl({ sticker }: Props) {
  const { selectedInstanceId, selectSticker, updatePlaced } = useStickers()
  const selected = selectedInstanceId === sticker.instanceId
  const stickerRef = useRef(sticker)
  stickerRef.current = sticker

  const bodyRef = useRef<HTMLDivElement>(null)
  const [lockedRing, setLockedRing] = useState<LockedRing | null>(null)

  // Lock ring dimensions once when selected — never tied to rotated bounding box.
  useLayoutEffect(() => {
    if (!selected) {
      setLockedRing(null)
      return
    }

    const img = bodyRef.current?.querySelector(
      'img.sticker__art',
    ) as HTMLImageElement | null
    if (!img) return

    const lockFromImage = () => {
      // Use intrinsic height + aspect only — never layout box (changes when rotated).
      const h = stickerHeight(STICKER_SIZE_PLACED, sticker.assetId)
      const aspect =
        img.naturalWidth > 0 && img.naturalHeight > 0
          ? img.naturalWidth / img.naturalHeight
          : 1
      const w = h * aspect
      const stickerOuterR = Math.hypot(w, h) / 2
      const trackR = stickerOuterR + TRACK_GAP_PX
      const ringSize = Math.ceil(
        2 * (trackR + TRACK_STROKE_PX / 2 + SCRUBBER_R_PX),
      )

      setLockedRing({
        ringSize,
        trackR,
        cx: ringSize / 2,
        cy: ringSize / 2,
      })
    }

    if (img.complete) {
      lockFromImage()
    } else {
      img.addEventListener('load', lockFromImage, { once: true })
      return () => img.removeEventListener('load', lockFromImage)
    }
  }, [selected, sticker.instanceId, sticker.assetId])

  const stopBubble = (e: React.PointerEvent) => {
    e.stopPropagation()
  }

  const startRotateScrub = (e: React.PointerEvent) => {
    e.preventDefault()
    e.stopPropagation()
    selectSticker(sticker.instanceId)

    const s = stickerRef.current
    const pointerAngle = angleFromCenter(s.x, s.y, e.pageX, e.pageY)
    const angleOffset = pointerAngle - s.rotation

    const onMove = (ev: PointerEvent) => {
      const cur = stickerRef.current
      const angle = angleFromCenter(cur.x, cur.y, ev.pageX, ev.pageY)
      const rotation = Math.round((angle - angleOffset) * 10) / 10
      updatePlaced(cur.instanceId, { rotation })
    }

    const onUp = () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
    }

    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
  }

  const onBodyPointerDown = (e: React.PointerEvent) => {
    if ((e.target as HTMLElement).closest('[data-sticker-rotate]')) return

    const wasSelected = selected
    if (!wasSelected) {
      selectSticker(sticker.instanceId)
    }

    const startX = e.pageX
    const startY = e.pageY
    let mode: 'tap' | 'move' = 'tap'

    const onMove = (ev: PointerEvent) => {
      const dx = ev.pageX - startX
      const dy = ev.pageY - startY
      if (mode === 'tap' && Math.hypot(dx, dy) >= MOVE_THRESHOLD) {
        mode = 'move'
      }
      if (mode === 'move') {
        updatePlaced(stickerRef.current.instanceId, {
          x: ev.pageX,
          y: ev.pageY,
        })
      }
    }

    const onUp = (ev: PointerEvent) => {
      const dx = ev.pageX - startX
      const dy = ev.pageY - startY
      if (mode === 'tap' && Math.hypot(dx, dy) < MOVE_THRESHOLD && wasSelected) {
        selectSticker(null)
      }
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
    }

    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
  }

  const ring = lockedRing
  const dotAngle = ring
    ? ((sticker.rotation - 90) * Math.PI) / 180
    : 0
  const dotX = ring ? ring.cx + ring.trackR * Math.cos(dotAngle) : 0
  const dotY = ring ? ring.cy + ring.trackR * Math.sin(dotAngle) : 0

  return (
    <div
      className={`sticker-placed${selected ? ' sticker-placed--selected' : ''}`}
      style={{ left: sticker.x, top: sticker.y }}
      onPointerDown={stopBubble}
    >
      <div
        ref={bodyRef}
        role="button"
        tabIndex={0}
        className="sticker-placed__body"
        aria-label={
          selected
            ? `${sticker.alt}, selected. Drag sticker to move, drag ring or dot to rotate, click to set.`
            : `Select ${sticker.alt}`
        }
        aria-pressed={selected}
        onPointerDown={onBodyPointerDown}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            selectSticker(selected ? null : sticker.instanceId)
          }
          if (e.key === 'Escape' && selected) selectSticker(null)
        }}
      >
        {selected && ring && (
          <div
            className="sticker-placed__rotate-track"
            data-sticker-rotate
            style={{ width: ring.ringSize, height: ring.ringSize }}
            aria-hidden
          >
            <svg
              className="sticker-placed__track-svg"
              width={ring.ringSize}
              height={ring.ringSize}
              viewBox={`0 0 ${ring.ringSize} ${ring.ringSize}`}
            >
              <circle
                className="sticker-placed__track-hit"
                cx={ring.cx}
                cy={ring.cy}
                r={ring.trackR}
                onPointerDown={startRotateScrub}
              />
              <circle
                className="sticker-placed__track-ring"
                cx={ring.cx}
                cy={ring.cy}
                r={ring.trackR}
                pointerEvents="none"
              />
            </svg>
          </div>
        )}
        <Sticker
          src={sticker.src}
          alt={sticker.alt}
          assetId={sticker.assetId}
          size="placed"
          rotation={sticker.rotation}
          selected={selected}
        />
        {selected && ring && (
          <div
            className="sticker-placed__rotate-scrubber"
            data-sticker-rotate
            style={{ width: ring.ringSize, height: ring.ringSize }}
            aria-hidden
          >
            <svg
              className="sticker-placed__track-svg"
              width={ring.ringSize}
              height={ring.ringSize}
              viewBox={`0 0 ${ring.ringSize} ${ring.ringSize}`}
            >
              <circle
                className="sticker-placed__scrubber-hit"
                cx={dotX}
                cy={dotY}
                r={SCRUBBER_HIT_R_PX}
                onPointerDown={startRotateScrub}
              />
              <circle
                className="sticker-placed__scrubber"
                cx={dotX}
                cy={dotY}
                r={SCRUBBER_R_PX}
                pointerEvents="none"
              />
              <circle
                className="sticker-placed__scrubber-center"
                cx={dotX}
                cy={dotY}
                r={SCRUBBER_CENTER_R_PX}
                pointerEvents="none"
              />
            </svg>
          </div>
        )}
      </div>
    </div>
  )
}
