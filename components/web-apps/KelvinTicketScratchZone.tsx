'use client'

import {
  paintTicketCover,
  scratchErasedPercent,
  scratchPointFromEvent,
  scratchStroke,
} from '@/lib/kelvinTicketScratchCanvas'
import { KELVIN_SCRATCH_REVEAL_SRC } from '@/lib/kelvinScratchTicket'
import {
  COIN_BRUSH_PX,
  SCRATCH_CARD_PX,
} from '@/lib/webAppsScratchAssets'
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type RefObject,
} from 'react'

type Props = {
  zoneWidth: number
  zoneHeight: number
  ticketCoverImg: HTMLImageElement
  coinBrushSrc: string
  enabled: boolean
  coinInTray: boolean
  /** Scratch can start outside the foil when set (e.g. stage or ticket frame). */
  captureRootRef?: RefObject<HTMLElement | null>
  onScratch: (
    value: number,
    pos: unknown,
    global: { x: number; y: number },
  ) => void
  onScratchStart: () => void
  onScratchEnd: () => void
}

function loadBrush(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('brush load failed'))
    img.src = src
  })
}

function isScratchPointerTarget(target: EventTarget | null): boolean {
  if (!(target instanceof Element)) return false
  return !target.closest(
    'button, a, input, textarea, select, label, [role="button"]',
  )
}

/**
 * Ticket scratch panel: reveal img + cover canvas, both sized to the ticket zone.
 * Cover is repainted whenever zoneWidth/zoneHeight change (unlike react-scratchcard).
 */
export function KelvinTicketScratchZone({
  zoneWidth,
  zoneHeight,
  ticketCoverImg,
  coinBrushSrc,
  enabled,
  coinInTray,
  captureRootRef,
  onScratch,
  onScratchStart,
  onScratchEnd,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const brushImgRef = useRef<HTMLImageElement | null>(null)
  const lastPointRef = useRef<{ x: number; y: number } | null>(null)
  const scratchingRef = useRef(false)
  const lastSampleRef = useRef(0)
  const [brushReady, setBrushReady] = useState(false)

  const onScratchRef = useRef(onScratch)
  const onScratchStartRef = useRef(onScratchStart)
  const onScratchEndRef = useRef(onScratchEnd)
  onScratchRef.current = onScratch
  onScratchStartRef.current = onScratchStart
  onScratchEndRef.current = onScratchEnd

  const brushPx = Math.max(
    12,
    Math.round(COIN_BRUSH_PX * (zoneWidth / SCRATCH_CARD_PX)),
  )

  const dpr =
    typeof window !== 'undefined'
      ? Math.min(2, window.devicePixelRatio || 1)
      : 1

  useEffect(() => {
    let cancelled = false
    loadBrush(coinBrushSrc).then((img) => {
      if (cancelled) return
      brushImgRef.current = img
      setBrushReady(true)
    })
    return () => {
      cancelled = true
    }
  }, [coinBrushSrc])

  useLayoutEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || zoneWidth < 1 || zoneHeight < 1) return

    const bufferW = Math.max(1, Math.floor(zoneWidth * dpr))
    const bufferH = Math.max(1, Math.floor(zoneHeight * dpr))
    canvas.width = bufferW
    canvas.height = bufferH
    canvas.style.width = `${zoneWidth}px`
    canvas.style.height = `${zoneHeight}px`

    const ctx = canvas.getContext('2d', { willReadFrequently: true })
    if (!ctx) return

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    paintTicketCover(ctx, ticketCoverImg, zoneWidth, zoneHeight)
  }, [ticketCoverImg, zoneWidth, zoneHeight, dpr])

  const samplePercent = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return 0
    const ctx = canvas.getContext('2d', { willReadFrequently: true })
    if (!ctx) return 0
    return scratchErasedPercent(ctx, canvas.width, canvas.height)
  }, [])

  const endScratch = useCallback(() => {
    if (!scratchingRef.current) return
    scratchingRef.current = false
    lastPointRef.current = null
    onScratchEndRef.current()
  }, [])

  const applyScratchMove = useCallback(
    (e: PointerEvent) => {
      if (!scratchingRef.current || !enabled) return
      const canvas = canvasRef.current
      const brush = brushImgRef.current
      const ctx = canvas?.getContext('2d')
      const last = lastPointRef.current
      if (!canvas || !brush || !ctx || !last) return

      const point = scratchPointFromEvent(e, canvas)
      scratchStroke(ctx, last, point, brush, brushPx, brushPx)
      lastPointRef.current = point

      const now = Date.now()
      if (now - lastSampleRef.current < 16) return
      lastSampleRef.current = now
      const percent = samplePercent()
      onScratchRef.current(percent, point, { x: e.clientX, y: e.clientY })
    },
    [enabled, brushPx, samplePercent],
  )

  useEffect(() => {
    const root = captureRootRef?.current
    if (!root || !enabled || coinInTray || !brushReady) return

    const onPointerDown = (e: PointerEvent) => {
      if (e.button !== 0 || !isScratchPointerTarget(e.target)) return
      const canvas = canvasRef.current
      if (!canvas) return
      root.setPointerCapture(e.pointerId)
      scratchingRef.current = true
      lastPointRef.current = scratchPointFromEvent(e, canvas)
      onScratchStartRef.current()
    }

    const onPointerMove = (e: PointerEvent) => {
      if (!scratchingRef.current) return
      applyScratchMove(e)
    }

    const onPointerUp = (e: PointerEvent) => {
      if (root.hasPointerCapture(e.pointerId)) {
        root.releasePointerCapture(e.pointerId)
      }
      endScratch()
    }

    root.addEventListener('pointerdown', onPointerDown)
    root.addEventListener('pointermove', onPointerMove)
    root.addEventListener('pointerup', onPointerUp)
    root.addEventListener('pointercancel', onPointerUp)

    return () => {
      root.removeEventListener('pointerdown', onPointerDown)
      root.removeEventListener('pointermove', onPointerMove)
      root.removeEventListener('pointerup', onPointerUp)
      root.removeEventListener('pointercancel', onPointerUp)
    }
  }, [
    captureRootRef,
    enabled,
    coinInTray,
    brushReady,
    applyScratchMove,
    endScratch,
  ])

  if (zoneWidth < 1 || zoneHeight < 1) {
    return (
      <div className="kelvin-ticket-scratch">
        <div className="kelvin-quad-scratch__placeholder web-apps-scratch__placeholder" />
      </div>
    )
  }

  return (
    <div className="kelvin-ticket-scratch">
      <img
        className="kelvin-ticket-scratch__reveal"
        src={KELVIN_SCRATCH_REVEAL_SRC}
        alt=""
        draggable={false}
      />
      <canvas
        ref={canvasRef}
        className="kelvin-ticket-scratch__cover web-apps-scratch__scratch-canvas kelvin-quad-scratch__canvas"
        style={{
          cursor: coinInTray || !enabled ? 'default' : 'none',
          pointerEvents: 'none',
        }}
        aria-hidden
      />
    </div>
  )
}
