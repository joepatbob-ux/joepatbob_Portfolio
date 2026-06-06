'use client'

import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { rotateHandleAtPoint } from '@/lib/stickerHitTest'
import { useChapterNav } from '@/components/ChapterNavProvider'
import { Sticker } from '@/components/Sticker'
import type { PlacedSticker } from '@/components/StickerProvider'
import { useStickers } from '@/components/StickerProvider'
import {
  measureStickerArt,
  writeStickerPickData,
  type StickerArtMetrics,
} from '@/lib/stickerPickBounds'
import { chapterRevealForId, activeSlideIdPublished } from '@/lib/chapterSlideshow'
import { useLayoutTopBarNav } from '@/lib/hooks/useLayoutTopBarNav'
import {
  pointerAngleDeg,
  roundStickerRotation,
  shortestAngleDeltaDeg,
} from '@/lib/stickerRotation'

const MOVE_THRESHOLD = 6
const TRACK_GAP_PX = 8
const TRACK_STROKE_PX = 16
const SCRUBBER_R_PX = 14
const SCRUBBER_CENTER_R_PX = 5
const SCRUBBER_HIT_R_PX = 28

interface LockedRing extends StickerArtMetrics {
  ringSize: number
  trackR: number
  cx: number
  cy: number
}

function lockedRingFromArt(art: StickerArtMetrics): LockedRing {
  const trackR = art.outerR + TRACK_GAP_PX + TRACK_STROKE_PX / 2
  const ringSize = Math.ceil(
    2 * (trackR + TRACK_STROKE_PX / 2 + SCRUBBER_R_PX),
  )
  return {
    ...art,
    ringSize,
    trackR,
    cx: ringSize / 2,
    cy: ringSize / 2,
  }
}

interface Props {
  sticker: PlacedSticker
}

export function PlacedStickerControl({ sticker }: Props) {
  const {
    selectedInstanceId,
    draggingInstanceId,
    selectSticker,
    updatePlaced,
    beginDragPlaced,
  } = useStickers()
  const { activeSlideId } = useChapterNav()
  const topBarNav = useLayoutTopBarNav()
  const effectiveActiveSlideId = topBarNav
    ? (activeSlideId ?? activeSlideIdPublished())
    : activeSlideId

  const selected = selectedInstanceId === sticker.instanceId
  const isDragging = draggingInstanceId === sticker.instanceId

  const rootRef = useRef<HTMLDivElement>(null)
  const bodyRef = useRef<HTMLDivElement>(null)
  const rotatorRef = useRef<HTMLDivElement>(null)
  const rotatingRef = useRef(false)
  const stickerRef = useRef(sticker)
  stickerRef.current = sticker

  const [artLayout, setArtLayout] = useState<LockedRing | null>(null)

  useLayoutEffect(() => {
    const img = bodyRef.current?.querySelector(
      'img.sticker__art',
    ) as HTMLImageElement | null
    if (!img) return

    const syncFromImage = () => {
      const art = measureStickerArt(img, sticker.assetId)
      const layout = lockedRingFromArt(art)
      setArtLayout(layout)
      if (rootRef.current) {
        writeStickerPickData(rootRef.current, {
          w: art.bodyW,
          h: art.bodyH,
          artOffsetX: art.artOffsetX,
          artOffsetY: art.artOffsetY,
        })
      }
    }

    if (img.complete) {
      syncFromImage()
    } else {
      img.addEventListener('load', syncFromImage, { once: true })
      return () => img.removeEventListener('load', syncFromImage)
    }
  }, [sticker.instanceId, sticker.assetId])

  useLayoutEffect(() => {
    if (rotatingRef.current || !rotatorRef.current) return
    rotatorRef.current.style.transform = `rotate(${sticker.rotation}deg)`
  }, [sticker.rotation])

  const applyLiveRotation = (deg: number) => {
    if (rotatorRef.current) {
      rotatorRef.current.style.transform = `rotate(${deg}deg)`
    }
  }

  const startRotateScrub = (e: React.PointerEvent) => {
    e.preventDefault()
    e.stopPropagation()
    selectSticker(sticker.instanceId)

    const s = stickerRef.current
    const metrics = artLayout
    const pivotX = s.x - (metrics?.artOffsetX ?? 0)
    const pivotY = s.y - (metrics?.artOffsetY ?? 0)
    const pointerId = e.pointerId

    rotatingRef.current = true
    rootRef.current?.classList.add('sticker-placed--rotating')

    let rotation = s.rotation
    let lastPointerAngle = pointerAngleDeg(pivotX, pivotY, e.clientX, e.clientY)
    applyLiveRotation(rotation)

    const onMove = (ev: PointerEvent) => {
      if (ev.pointerId !== pointerId) return
      const angle = pointerAngleDeg(pivotX, pivotY, ev.clientX, ev.clientY)
      rotation += shortestAngleDeltaDeg(lastPointerAngle, angle)
      lastPointerAngle = angle
      applyLiveRotation(rotation)
    }

    const onUp = (ev: PointerEvent) => {
      if (ev.pointerId !== pointerId) return
      rotatingRef.current = false
      rootRef.current?.classList.remove('sticker-placed--rotating')
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      window.removeEventListener('pointercancel', onUp)
      const final = roundStickerRotation(rotation)
      applyLiveRotation(final)
      updatePlaced(stickerRef.current.instanceId, { rotation: final })
    }

    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    window.addEventListener('pointercancel', onUp)
  }

  const onHitPointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0 || isDragging) return

    const rotateHit = rotateHandleAtPoint(e.clientX, e.clientY)
    if (rotateHit) {
      startRotateScrub(e)
      return
    }

    e.preventDefault()
    e.stopPropagation()
    e.currentTarget.setPointerCapture(e.pointerId)

    const wasSelected = selected
    if (!wasSelected) {
      selectSticker(sticker.instanceId)
    }

    const startX = e.clientX
    const startY = e.clientY
    const pointerId = e.pointerId

    const onMove = (ev: PointerEvent) => {
      if (ev.pointerId !== pointerId) return
      const dx = ev.clientX - startX
      const dy = ev.clientY - startY
      if (Math.hypot(dx, dy) >= MOVE_THRESHOLD) {
        beginDragPlaced(sticker.instanceId, ev.clientX, ev.clientY)
        window.removeEventListener('pointermove', onMove)
        window.removeEventListener('pointerup', onUp)
        window.removeEventListener('pointercancel', onUp)
      }
    }

    const onUp = (ev: PointerEvent) => {
      if (ev.pointerId !== pointerId) return
      if (
        wasSelected &&
        Math.hypot(ev.clientX - startX, ev.clientY - startY) < MOVE_THRESHOLD
      ) {
        selectSticker(null)
      }
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      window.removeEventListener('pointercancel', onUp)
    }

    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    window.addEventListener('pointercancel', onUp)
  }

  useEffect(() => {
    if (!selected || !sticker.chapterId) return
    if (effectiveActiveSlideId === sticker.chapterId) return
    const reveal = chapterRevealForId(sticker.chapterId)
    if (reveal < 0.12) {
      selectSticker(null)
    }
  }, [effectiveActiveSlideId, selected, sticker.chapterId, selectSticker])

  const stickerVisible =
    selected ||
    (sticker.chapterId ? effectiveActiveSlideId === sticker.chapterId : true)

  const ring = artLayout
  const scrubberX = ring ? ring.cx : 0
  const scrubberY = ring ? ring.cy - ring.trackR : 0
  const bodyStyle = ring
    ? ({
        width: ring.bodyW,
        height: ring.bodyH,
        ['--ring-size' as string]: `${ring.ringSize}px`,
        ['--art-offset-x' as string]: `${ring.artOffsetX}px`,
        ['--art-offset-y' as string]: `${ring.artOffsetY}px`,
      } as React.CSSProperties)
    : undefined

  return (
    <div
      ref={rootRef}
      className={[
        'sticker-placed',
        artLayout ? 'sticker-placed--layout-stable' : '',
        selected ? 'sticker-placed--selected' : '',
        isDragging ? 'sticker-placed--ghost' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      data-sticker-instance={sticker.instanceId}
      data-sticker-asset-id={sticker.assetId}
      data-sticker-rotation={sticker.rotation}
      data-sticker-chapter-id={sticker.chapterId || undefined}
      data-sticker-visible={stickerVisible ? 'true' : 'false'}
      data-pick-w={ring?.bodyW}
      data-pick-h={ring?.bodyH}
      data-pick-ox={ring?.artOffsetX}
      data-pick-oy={ring?.artOffsetY}
      style={{
        zIndex: sticker.zIndex,
        left: sticker.x,
        top: sticker.y,
        opacity:
          isDragging ? 0 : selected || !sticker.chapterId ? 1 : undefined,
        visibility:
          isDragging ? 'hidden' : selected || !sticker.chapterId ? 'visible' : undefined,
      }}
    >
      <div
        ref={bodyRef}
        className="sticker-placed__body"
        style={bodyStyle}
        aria-label={
          selected
            ? `${sticker.alt}, selected. Drag to move, drag orange dot to rotate, tap again to set down.`
            : `${sticker.alt}. Drag to pick up and place.`
        }
      >
        <button
          type="button"
          className="sticker-placed__hit"
          aria-pressed={selected}
          onPointerDown={onHitPointerDown}
          onClick={(e) => e.preventDefault()}
        />

        {selected && ring && (
          <div
            className="sticker-placed__ring-stage sticker-placed__ring-stage--track"
            style={{ width: ring.ringSize, height: ring.ringSize }}
            aria-hidden
          >
            <svg
              className="sticker-placed__ring-svg"
              width={ring.ringSize}
              height={ring.ringSize}
              viewBox={`0 0 ${ring.ringSize} ${ring.ringSize}`}
            >
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

        <div
          ref={rotatorRef}
          className="sticker-placed__rotator"
          style={{ transform: `rotate(${sticker.rotation}deg)` }}
        >
          <div className="sticker-placed__sticker-center">
            <div
              className={`sticker-placed__art${selected ? ' sticker-placed__art--lifted' : ''}`}
            >
              <Sticker
                src={sticker.src}
                alt={sticker.alt}
                assetId={sticker.assetId}
                size="placed"
                rotation={0}
                selected={selected}
              />
            </div>
          </div>
          {selected && ring && (
            <div className="sticker-placed__scrubber-mount" aria-hidden>
              <svg
                className="sticker-placed__ring-svg"
                width={ring.ringSize}
                height={ring.ringSize}
                viewBox={`0 0 ${ring.ringSize} ${ring.ringSize}`}
              >
                <circle
                  className="sticker-placed__scrubber-hit"
                  cx={scrubberX}
                  cy={scrubberY}
                  r={SCRUBBER_HIT_R_PX}
                  onPointerDown={startRotateScrub}
                />
                <circle
                  className="sticker-placed__scrubber"
                  cx={scrubberX}
                  cy={scrubberY}
                  r={SCRUBBER_R_PX}
                  pointerEvents="none"
                />
                <circle
                  className="sticker-placed__scrubber-center"
                  cx={scrubberX}
                  cy={scrubberY}
                  r={SCRUBBER_CENTER_R_PX}
                  pointerEvents="none"
                />
              </svg>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
