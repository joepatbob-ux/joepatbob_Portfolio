'use client'

import {
  anchorOnRect,
  buildAssetTroupePath,
  buildAssetTroupePathD,
  EIM_DRAW_EASE,
  EIM_LINE_DASH,
  EIM_LINE_STROKE,
  EIM_LINE_WIDTH,
  pickConnectionSides,
  troupePathMidpoint,
  type PathPoint,
  wanderForSpan,
} from '@/lib/eimMeanderPath'
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type RefObject,
} from 'react'

const GHOST_MS = 200

export interface AssetAnchors {
  width: number
  height: number
  start: PathPoint
  end: PathPoint
  wander: number
}

interface Props {
  canvasRef: RefObject<HTMLElement | null>
  fromRef: RefObject<HTMLElement | null>
  toRef: RefObject<HTMLElement | null>
  pathSeed: number
  /** Optional slice of troupe path (mobile segments). */
  tStart?: number
  tEnd?: number
  wander?: number
  drawDurationMs: number
  showLabel?: boolean
  active?: boolean
  triggerDraw?: boolean
  onDrawComplete?: () => void
  className?: string
}

export function measureAssetAnchors(
  canvas: HTMLElement,
  fromEl: HTMLElement,
  toEl: HTMLElement,
  wanderOverride?: number,
): AssetAnchors | null {
  const canvasRect = canvas.getBoundingClientRect()
  if (canvasRect.width < 1 || canvasRect.height < 1) return null

  const fromRect = fromEl.getBoundingClientRect()
  const toRect = toEl.getBoundingClientRect()
  if (fromRect.width < 1 || toRect.width < 1) return null

  const origin = { x: canvasRect.left, y: canvasRect.top }
  const { exit, enter } = pickConnectionSides(fromRect, toRect)
  const start = anchorOnRect(fromRect, exit, origin)
  const end = anchorOnRect(toRect, enter, origin)
  const span = Math.hypot(end.x - start.x, end.y - start.y)
  const wander = wanderOverride ?? wanderForSpan(span)

  return {
    width: canvasRect.width,
    height: canvasRect.height,
    start,
    end,
    wander,
  }
}

export function EimConnectorPath({
  canvasRef,
  fromRef,
  toRef,
  pathSeed,
  tStart = 0,
  tEnd = 1,
  wander: wanderOverride,
  drawDurationMs,
  showLabel = false,
  active = true,
  triggerDraw = true,
  onDrawComplete,
  className,
}: Props) {
  const pathRef = useRef<SVGPathElement>(null)
  const [anchors, setAnchors] = useState<AssetAnchors | null>(null)
  const [pathLen, setPathLen] = useState(0)
  const [ghostVisible, setGhostVisible] = useState(false)
  const [drawn, setDrawn] = useState(false)
  const completeRef = useRef(onDrawComplete)
  completeRef.current = onDrawComplete

  const measure = useCallback(() => {
    const canvas = canvasRef.current
    const fromEl = fromRef.current
    const toEl = toRef.current
    if (!canvas || !fromEl || !toEl) return
    const next = measureAssetAnchors(canvas, fromEl, toEl, wanderOverride)
    if (next) setAnchors(next)
  }, [canvasRef, fromRef, toRef, wanderOverride])

  useEffect(() => {
    measure()
    const canvas = canvasRef.current
    if (!canvas) return

    const ro = new ResizeObserver(() => measure())
    ro.observe(canvas)
    const fromEl = fromRef.current
    const toEl = toRef.current
    if (fromEl) ro.observe(fromEl)
    if (toEl) ro.observe(toEl)

    const onLoad = () => measure()
    const fromImg = fromEl?.querySelector('img')
    const toImg = toEl?.querySelector('img')
    fromImg?.addEventListener('load', onLoad)
    toImg?.addEventListener('load', onLoad)
    if (fromImg?.complete) measure()
    if (toImg?.complete) measure()

    window.addEventListener('resize', measure)
    return () => {
      ro.disconnect()
      window.removeEventListener('resize', measure)
      fromImg?.removeEventListener('load', onLoad)
      toImg?.removeEventListener('load', onLoad)
    }
  }, [canvasRef, fromRef, toRef, measure, pathSeed])

  const pathD =
    anchors && anchors.width > 0
      ? buildAssetTroupePathD(
          anchors.start,
          anchors.end,
          anchors.wander,
          pathSeed,
          tStart,
          tEnd,
        )
      : ''

  const labelPos =
    showLabel && anchors
      ? troupePathMidpoint(
          buildAssetTroupePath(
            anchors.start,
            anchors.end,
            anchors.wander,
            pathSeed,
            tStart,
            tEnd,
          ),
        )
      : null

  useEffect(() => {
    const path = pathRef.current
    if (!path || !pathD) return
    setPathLen(path.getTotalLength())
  }, [pathD])

  useEffect(() => {
    if (!active) {
      setGhostVisible(false)
      setDrawn(false)
      return
    }
    if (!triggerDraw || !pathD) return

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduced) {
      setGhostVisible(true)
      setDrawn(true)
      completeRef.current?.()
      return
    }

    setDrawn(false)
    setGhostVisible(true)

    const drawTimer = window.setTimeout(() => setDrawn(true), GHOST_MS)
    const doneTimer = window.setTimeout(
      () => completeRef.current?.(),
      GHOST_MS + drawDurationMs,
    )

    return () => {
      window.clearTimeout(drawTimer)
      window.clearTimeout(doneTimer)
    }
  }, [active, triggerDraw, drawDurationMs, pathD])

  const dashOffset = drawn ? 0 : pathLen

  if (!anchors || !pathD) return null

  return (
    <svg
      className={['eim-connector-path', className].filter(Boolean).join(' ')}
      width={anchors.width}
      height={anchors.height}
      viewBox={`0 0 ${anchors.width} ${anchors.height}`}
      aria-hidden
    >
      <path
        d={pathD}
        fill="none"
        stroke={EIM_LINE_STROKE}
        strokeWidth={EIM_LINE_WIDTH}
        strokeLinecap="round"
        opacity={ghostVisible ? 0.08 : 0}
        strokeDasharray={EIM_LINE_DASH}
        style={{ transition: `opacity ${GHOST_MS}ms ease` }}
      />
      <path
        ref={pathRef}
        d={pathD}
        fill="none"
        stroke={EIM_LINE_STROKE}
        strokeWidth={EIM_LINE_WIDTH}
        strokeLinecap="round"
        strokeDasharray={EIM_LINE_DASH}
        strokeDashoffset={dashOffset}
        style={{
          transition: `stroke-dashoffset ${drawDurationMs}ms ${EIM_DRAW_EASE}`,
        }}
      />
      {showLabel && labelPos && (
        <text
          x={labelPos.x}
          y={labelPos.y}
          textAnchor="middle"
          dominantBaseline="middle"
          className="eim-meander-line__label"
        >
          900MHz
        </text>
      )}
    </svg>
  )
}
