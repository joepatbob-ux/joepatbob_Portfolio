'use client'

import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { rotateHandleAtPoint } from '@/lib/stickerHitTest'
import { useChapterNav } from '@/components/ChapterNavProvider'
import { Sticker } from '@/components/Sticker'
import type { PlacedSticker } from '@/components/StickerProvider'
import { useStickers } from '@/components/StickerProvider'
import {
  measureStickerArt,
  readStickerPickMetrics,
  writeStickerPickData,
  type StickerArtMetrics,
} from '@/lib/stickerPickBounds'
import {
  pointerAngleDeg,
  roundStickerRotation,
  shortestAngleDeltaDeg,
} from '@/lib/stickerRotation'

const MOVE_THRESHOLD = 8
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
  const [artLayout, setArtLayout] = useState<LockedRing | null>(null)

  // Measure once per asset — keeps layout stable between set/repickup (no jump on select).
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

  const startRotateScrub = (e: PointerEvent) => {
    e.preventDefault()
    e.stopPropagation()
    selectSticker(sticker.instanceId)
    const pointerId = e.pointerId
    const s = stickerRef.current
    const metrics = rootRef.current
      ? readStickerPickMetrics(rootRef.current)
      : null
    const offX = metrics?.artOffsetX ?? artLayout?.artOffsetX ?? 0
    const offY = metrics?.artOffsetY ?? artLayout?.artOffsetY ?? 0
    const pivotX = s.x - offX
    const pivotY = s.y - offY

    rotatingRef.current = true
    rootRef.current?.classList.add('sticker-placed--rotating')

    let rotation = s.rotation
    let lastPointerAngle = pointerAngleDeg(pivotX, pivotY, e.clientX, e.clientY)
    applyLiveRotation(rotation)

    const removeRotateListeners = () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      window.removeEventListener('pointercancel', onUp)
    }

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
      removeRotateListeners()

      const final = roundStickerRotation(rotation)
      applyLiveRotation(final)
      updatePlaced(stickerRef.current.instanceId, { rotation: final })
    }

    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    window.addEventListener('pointercancel', onUp)
  }

  const onBodyPointerDown = (e: PointerEvent) => {
    if (e.button !== 0) return

    const rotateHit = rotateHandleAtPoint(e.clientX, e.clientY)
    if (rotateHit) {
      startRotateScrub(e)
      return
    }

    const body = bodyRef.current
    if (!body) return

    const wasSelected = selectedRef.current
    if (!wasSelected) {
      selectSticker(sticker.instanceId)
    }

    const pointerId = e.pointerId
    const startX = e.clientX
    const startY = e.clientY
    const grabOffsetX = startX - stickerRef.current.x
    const grabOffsetY = startY - stickerRef.current.y
    let mode: 'tap' | 'move' = 'tap'

    const removeDragListeners = () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', end)
      window.removeEventListener('pointercancel', end)
    }

    const end = (ev: PointerEvent) => {
      if (ev.pointerId !== pointerId) return

      const dx = ev.clientX - startX
      const dy = ev.clientY - startY
      // Tap on an already-selected sticker sets it (closes the ring).
      if (
        mode === 'tap' &&
        Math.hypot(dx, dy) < MOVE_THRESHOLD &&
        wasSelected
      ) {
        selectSticker(null)
      }

      rootRef.current?.classList.remove('sticker-placed--dragging')
      removeDragListeners()
    }

    const onMove = (ev: PointerEvent) => {
      if (ev.pointerId !== pointerId) return
      const dx = ev.clientX - startX
      const dy = ev.clientY - startY
      if (mode === 'tap' && Math.hypot(dx, dy) >= MOVE_THRESHOLD) {
        mode = 'move'
        rootRef.current?.classList.add('sticker-placed--dragging')
      }
      if (mode === 'move') {
        updatePlaced(stickerRef.current.instanceId, {
          x: ev.clientX - grabOffsetX,
          y: ev.clientY - grabOffsetY,
        })
      }
    }

    // Pointerdown is routed from StickerLayer (capture), not from the body node — use window
    // listeners so move/up still fire while the sticker has pointer-events: none.
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', end)
    window.addEventListener('pointercancel', end)
  }

  const onPlacedPointerDownRef = useRef<(e: PointerEvent) => void>(() => {})

  onPlacedPointerDownRef.current = (e: PointerEvent) => {
    if (rotatingRef.current) return
    const rotateHit = rotateHandleAtPoint(e.clientX, e.clientY)
    if (rotateHit) {
      startRotateScrub(e)
      return
    }
    onBodyPointerDown(e)
  }

  useEffect(() => {
    const handler = (e: PointerEvent) => onPlacedPointerDownRef.current(e)
    registerPlacedPointer(sticker.instanceId, handler)
    return () => registerPlacedPointer(sticker.instanceId, null)
  }, [sticker.instanceId, registerPlacedPointer])

  useEffect(() => {
    if (!selected || !sticker.chapterId) return
    const reveal = reveals[sticker.chapterId]
    if (reveal !== undefined && reveal < 0.12) {
      selectSticker(null)
    }
  }, [reveals, selected, sticker.chapterId, selectSticker])

  const chapterReveal = sticker.chapterId
    ? (reveals[sticker.chapterId] ?? 0)
    : 1
  const stickerVisible = chapterReveal > 0.08

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
        opacity: stickerVisible ? 1 : 0,
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
            ? `${sticker.alt}, selected. Drag to move, drag orange dot to rotate, click sticker to set.`
            : `${sticker.alt}. Click and drag to pick up and move.`
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
