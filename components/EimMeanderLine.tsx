'use client'

import {
  buildEimMeanderPath,
  eimMeanderMidpoint,
  EIM_DRAW_EASE,
  EIM_LINE_DASH,
  EIM_LINE_STROKE,
  EIM_LINE_WIDTH,
} from '@/lib/eimMeanderPath'
import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
} from 'react'

const GHOST_MS = 200
const GHOST_OPACITY = 0.08

interface Props {
  amplitude: number
  height?: number
  fillHeight?: boolean
  drawDurationMs: number
  showLabel?: boolean
  active?: boolean
  triggerDraw?: boolean
  onDrawComplete?: () => void
  className?: string
  style?: CSSProperties
}

export function EimMeanderLine({
  amplitude,
  height: fixedHeight,
  fillHeight = false,
  drawDurationMs,
  showLabel = false,
  active = true,
  triggerDraw = true,
  onDrawComplete,
  className,
  style,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const pathRef = useRef<SVGPathElement>(null)
  const [measuredH, setMeasuredH] = useState(fixedHeight ?? 0)
  const [pathLen, setPathLen] = useState(0)
  const [ghostVisible, setGhostVisible] = useState(false)
  const [drawn, setDrawn] = useState(false)
  const completeRef = useRef(onDrawComplete)
  completeRef.current = onDrawComplete

  const height = fillHeight ? measuredH : (fixedHeight ?? 0)
  const centerX = amplitude + 12

  useEffect(() => {
    if (!fillHeight) {
      setMeasuredH(fixedHeight ?? 0)
      return
    }
    const el = containerRef.current
    if (!el) return

    const measure = () => {
      const next = el.getBoundingClientRect().height
      if (next > 0) setMeasuredH(next)
    }

    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [fillHeight, fixedHeight])

  const pathD =
    height > 0 ? buildEimMeanderPath(height, amplitude, centerX) : ''
  const labelPos =
    showLabel && height > 0
      ? eimMeanderMidpoint(height, amplitude, centerX)
      : null
  const svgW = centerX * 2

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

  return (
    <div
      ref={containerRef}
      className={['eim-meander-line', className].filter(Boolean).join(' ')}
      style={style}
      data-fill-height={fillHeight || undefined}
      aria-hidden={!pathD}
    >
      {pathD ? (
        <svg
          className="eim-meander-line__svg"
          width={svgW}
          height={height}
          viewBox={`0 0 ${svgW} ${height}`}
          aria-hidden
        >
          <path
            d={pathD}
            fill="none"
            stroke={EIM_LINE_STROKE}
            strokeWidth={EIM_LINE_WIDTH}
            strokeLinecap="round"
            opacity={ghostVisible ? GHOST_OPACITY : 0}
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
      ) : null}
    </div>
  )
}
