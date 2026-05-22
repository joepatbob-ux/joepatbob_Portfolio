'use client'

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { rotateHandleAtPoint } from '@/lib/stickerHitTest'
import { useChapterNav } from '@/components/ChapterNavProvider'
import { Sticker } from '@/components/Sticker'
import type { PlacedSticker } from '@/components/StickerProvider'
import { useStickers } from '@/components/StickerProvider'
import { measureStickerOpticalLayout } from '@/lib/stickerOptical'
import {
  pointerAngleDeg,
  roundStickerRotation,
  shortestAngleDeltaDeg,
} from '@/lib/stickerRotation'
import { STICKER_SIZE_PLACED, stickerHeight } from '@/lib/stickers'

const MOVE_THRESHOLD = 8
const TRACK_GAP_PX = 8
const TRACK_STROKE_PX = 16
const SCRUBBER_R_PX = 14
const SCRUBBER_CENTER_R_PX = 5
const SCRUBBER_HIT_R_PX = 28

interface LockedRing {
  ringSize: number
  trackR: number
  cx: number
  cy: number
  bodyW: number
  bodyH: number
  artOffsetX: number
  artOffsetY: number
}

interface Props {
  sticker: PlacedSticker
}

export function PlacedStickerControl({ sticker }: Props) {
  const { selectedInstanceId, selectSticker, updatePlaced, registerPlacedPointer } =
    useStickers()
  const { reveals } = useChapterNav()
  const selected = selectedInstanceId === sticker.instanceId
  const selectedRef = useRef(selected)
  selectedRef.current = selected
  const stickerRef = useRef(sticker)
  stickerRef.current = sticker

  const rootRef = useRef<HTMLDivElement>(null)
  const bodyRef = useRef<HTMLDivElement>(null)
  const rotatorRef = useRef<HTMLDivElement>(null)
  const rotatingRef = useRef(false)
  const [lockedRing, setLockedRing] = useState<LockedRing | null>(null)

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
      let w = img.offsetWidth
      let h = img.offsetHeight
      if (w <= 0 || h <= 0) {
        h = stickerHeight(STICKER_SIZE_PLACED, sticker.assetId)
        const aspect =
          img.naturalWidth > 0 && img.naturalHeight > 0
            ? img.naturalWidth / img.naturalHeight
            : 1
        w = h * aspect
      }
      const optical = measureStickerOpticalLayout(img, w, h)
      const outerR = optical?.outerRadius ?? Math.hypot(w, h) / 2
      const trackR = outerR + TRACK_GAP_PX + TRACK_STROKE_PX / 2
      const ringSize = Math.ceil(
        2 * (trackR + TRACK_STROKE_PX / 2 + SCRUBBER_R_PX),
      )

      const artOffsetX = optical?.offsetX ?? 0
      const artOffsetY = optical?.offsetY ?? 0
      setLockedRing({
        ringSize,
        trackR,
        cx: ringSize / 2,
        cy: ringSize / 2,
        bodyW: w,
        bodyH: h,
        artOffsetX,
        artOffsetY,
      })
    }

    if (img.complete) {
      lockFromImage()
    } else {
      img.addEventListener('load', lockFromImage, { once: true })
      return () => img.removeEventListener('load', lockFromImage)
    }
  }, [selected, sticker.instanceId, sticker.assetId])

  useLayoutEffect(() => {
    if (rotatingRef.current || !rotatorRef.current) return
    rotatorRef.current.style.transform = `rotate(${sticker.rotation}deg)`
  }, [sticker.rotation])

  const applyLiveRotation = (deg: number) => {
    if (rotatorRef.current) {
      rotatorRef.current.style.transform = `rotate(${deg}deg)`
    }
  }

  const startRotateScrub = (e: PointerEvent, target: SVGCircleElement) => {
    e.preventDefault()
    e.stopPropagation()
    selectSticker(sticker.instanceId)
    const pointerId = e.pointerId
    const s = stickerRef.current
    const offX = lockedRing?.artOffsetX ?? 0
    const offY = lockedRing?.artOffsetY ?? 0
    const pivotX = s.x - offX
    const pivotY = s.y - offY

    rotatingRef.current = true
    rootRef.current?.classList.add('sticker-placed--rotating')

    let rotation = s.rotation
    let lastPointerAngle = pointerAngleDeg(pivotX, pivotY, e.clientX, e.clientY)
    applyLiveRotation(rotation)

    target.setPointerCapture(pointerId)

    const onMove = (ev: PointerEvent) => {
      if (ev.pointerId !== pointerId) return
      const angle = pointerAngleDeg(pivotX, pivotY, ev.clientX, ev.clientY)
      rotation += shortestAngleDeltaDeg(lastPointerAngle, angle)
      lastPointerAngle = angle
      applyLiveRotation(rotation)
    }

    const onUp = (ev: PointerEvent) => {
      if (ev.pointerId !== pointerId) return
      if (target.hasPointerCapture(pointerId)) {
        target.releasePointerCapture(pointerId)
      }
      target.removeEventListener('pointermove', onMove)
      target.removeEventListener('pointerup', onUp)
      target.removeEventListener('pointercancel', onUp)

      rotatingRef.current = false
      rootRef.current?.classList.remove('sticker-placed--rotating')

      const final = roundStickerRotation(rotation)
      applyLiveRotation(final)
      updatePlaced(stickerRef.current.instanceId, { rotation: final })
    }

    target.addEventListener('pointermove', onMove)
    target.addEventListener('pointerup', onUp)
    target.addEventListener('pointercancel', onUp)
  }

  const onBodyPointerDown = (e: PointerEvent) => {
    const rotateHit = rotateHandleAtPoint(e.clientX, e.clientY)
    if (rotateHit && selectedRef.current) {
      startRotateScrub(e, rotateHit)
      return
    }

    const body = bodyRef.current
    if (!body) return

    if (!selectedRef.current) {
      selectSticker(sticker.instanceId)
    }

    const pointerId = e.pointerId
    const startX = e.clientX
    const startY = e.clientY
    let mode: 'tap' | 'move' = 'tap'

    const end = (ev: PointerEvent) => {
      if (ev.pointerId !== pointerId) return

      if (body.hasPointerCapture(pointerId)) {
        body.releasePointerCapture(pointerId)
      }
      rootRef.current?.classList.remove('sticker-placed--dragging')
      body.removeEventListener('pointermove', onMove)
      body.removeEventListener('pointerup', end)
      body.removeEventListener('pointercancel', end)
    }

    const onMove = (ev: PointerEvent) => {
      if (ev.pointerId !== pointerId) return
      const dx = ev.clientX - startX
      const dy = ev.clientY - startY
      if (mode === 'tap' && Math.hypot(dx, dy) >= MOVE_THRESHOLD) {
        mode = 'move'
        body.setPointerCapture(pointerId)
        rootRef.current?.classList.add('sticker-placed--dragging')
      }
      if (mode === 'move') {
        updatePlaced(stickerRef.current.instanceId, {
          x: ev.clientX,
          y: ev.clientY,
        })
      }
    }

    body.addEventListener('pointermove', onMove)
    body.addEventListener('pointerup', end)
    body.addEventListener('pointercancel', end)
  }

  const onPlacedPointerDown = useCallback((e: PointerEvent) => {
    const rotateHit = rotateHandleAtPoint(e.clientX, e.clientY)
    if (rotateHit && selectedRef.current) {
      startRotateScrub(e, rotateHit)
      return
    }
    onBodyPointerDown(e)
  }, [sticker.instanceId])

  useEffect(() => {
    registerPlacedPointer(sticker.instanceId, onPlacedPointerDown)
    return () => registerPlacedPointer(sticker.instanceId, null)
  }, [sticker.instanceId, onPlacedPointerDown, registerPlacedPointer])

  useEffect(() => {
    if (!selected || !sticker.chapterId) return
    if ((reveals[sticker.chapterId] ?? 0) < 0.12) {
      selectSticker(null)
    }
  }, [reveals, selected, sticker.chapterId, selectSticker])

  const chapterReveal = sticker.chapterId
    ? (reveals[sticker.chapterId] ?? 0)
    : 1
  const stickerVisible = chapterReveal > 0.08

  const ring = lockedRing
  const scrubberX = ring ? ring.cx : 0
  const scrubberY = ring ? ring.cy - ring.trackR : 0
  const bodyStyle =
    selected && ring
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
      className={`sticker-placed${selected ? ' sticker-placed--selected' : ''}`}
      data-sticker-instance={sticker.instanceId}
      data-sticker-chapter-id={sticker.chapterId || undefined}
      data-sticker-visible={stickerVisible ? 'true' : 'false'}
      style={{
        zIndex: sticker.zIndex,
        left: sticker.x,
        top: sticker.y,
        opacity: stickerVisible ? chapterReveal : 0,
        pointerEvents: selected ? 'auto' : undefined,
        visibility: stickerVisible ? 'visible' : 'hidden',
      }}
    >
      <div
        ref={bodyRef}
        role="button"
        tabIndex={-1}
        className="sticker-placed__body"
        style={bodyStyle}
        aria-label={
          selected
            ? `${sticker.alt}, selected. Drag to move, drag ring or dot to rotate. Click outside to deselect.`
            : `Select ${sticker.alt}`
        }
        aria-pressed={selected}
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
                className="sticker-placed__track-hit"
                cx={ring.cx}
                cy={ring.cy}
                r={ring.trackR}
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
            <div
              className="sticker-placed__scrubber-mount"
              data-sticker-rotate
              aria-hidden
            >
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
