'use client'

import { EIM_DRAW_EASE } from '@/lib/eimMeanderPath'
import {
  EIM_PATH_VIEWBOX,
  EIM_TOUCH2_ORIGIN,
  isEimDashDebugEnabled,
  sortSubpathsByRevealOrder,
  splitPathSubpaths,
  subpathStartPoint,
} from '@/lib/eimPathSegments'
import { useCallback, useEffect, useRef, useState } from 'react'

const SVG_SRC = '/images/Devices/eimpath.svg'
const PATH_FILL = '#F5431B'
const GHOST_MS = 200
const GHOST_OPACITY = 0.08
const DASH_FADE_MS = 100

type DebugLabel = { order: number; x: number; y: number }

interface Props {
  active?: boolean
  triggerDraw?: boolean
  drawDurationMs?: number
  showLabel?: boolean
  className?: string
}

export function EimPathArt({
  active = true,
  triggerDraw = true,
  drawDurationMs = 1400,
  showLabel = true,
  className,
}: Props) {
  const svgHostRef = useRef<HTMLDivElement>(null)
  const dashRefs = useRef<SVGPathElement[]>([])
  const labelRef = useRef<SVGTextElement | null>(null)
  const [dashDebug, setDashDebug] = useState(false)
  const [dashCount, setDashCount] = useState(0)
  const [debugLabels, setDebugLabels] = useState<DebugLabel[]>([])
  const [ghostVisible, setGhostVisible] = useState(false)
  const [svgReady, setSvgReady] = useState(false)

  useEffect(() => {
    setDashDebug(isEimDashDebugEnabled())
  }, [])

  const resetDashes = useCallback(() => {
    dashRefs.current.forEach((path) => {
      path.style.transition = 'none'
      path.style.opacity = '0'
    })
  }, [])

  const measureDebugLabels = useCallback(() => {
    const host = svgHostRef.current
    if (!host) return []

    const paths = host.querySelectorAll<SVGPathElement>('.eim-path-art__dash')
    const labels: DebugLabel[] = []

    paths.forEach((path, index) => {
      let x = EIM_TOUCH2_ORIGIN.x
      let y = EIM_TOUCH2_ORIGIN.y

      try {
        const box = path.getBBox()
        if (Number.isFinite(box.width) && Number.isFinite(box.height)) {
          x = box.x + box.width / 2
          y = box.y + box.height / 2
        } else {
          throw new Error('invalid bbox')
        }
      } catch {
        const start = subpathStartPoint(path.getAttribute('d') ?? '')
        if (start) {
          x = start.x
          y = start.y
        }
      }

      labels.push({ order: index + 1, x, y })
    })

    return labels
  }, [])

  useEffect(() => {
    let cancelled = false
    const host = svgHostRef.current
    if (!host) return

    const debug = isEimDashDebugEnabled()

    fetch(SVG_SRC)
      .then((res) => res.text())
      .then((raw) => {
        if (cancelled || !svgHostRef.current) return

        const doc = new DOMParser().parseFromString(raw, 'image/svg+xml')
        const svg = doc.querySelector('svg')
        const meander = doc.querySelector(`path[fill="${PATH_FILL}"]`)
        if (!svg || !meander) return

        const d = meander.getAttribute('d')
        if (!d) return

        meander.remove()

        const segments = sortSubpathsByRevealOrder(splitPathSubpaths(d))
        dashRefs.current = []

        const ghostGroup = document.createElementNS(
          'http://www.w3.org/2000/svg',
          'g',
        )
        ghostGroup.setAttribute('class', 'eim-path-art__ghost-dashes')
        ghostGroup.setAttribute('opacity', debug ? '0' : '0')

        const dashGroup = document.createElementNS(
          'http://www.w3.org/2000/svg',
          'g',
        )
        dashGroup.setAttribute('class', 'eim-path-art__dashes')

        for (const segment of segments) {
          const ghostDash = document.createElementNS(
            'http://www.w3.org/2000/svg',
            'path',
          )
          ghostDash.setAttribute('d', segment)
          ghostDash.setAttribute('fill', PATH_FILL)

          const dash = document.createElementNS(
            'http://www.w3.org/2000/svg',
            'path',
          )
          dash.setAttribute('d', segment)
          dash.setAttribute('fill', PATH_FILL)
          dash.setAttribute('class', 'eim-path-art__dash')
          dash.style.opacity = debug ? '0.35' : '0'

          ghostGroup.appendChild(ghostDash)
          dashGroup.appendChild(dash)
          dashRefs.current.push(dash)
        }

        const measurePath = document.createElementNS(
          'http://www.w3.org/2000/svg',
          'path',
        )
        measurePath.setAttribute('d', segments.join(''))
        measurePath.setAttribute('fill', 'none')
        measurePath.setAttribute('stroke', 'none')
        measurePath.setAttribute('visibility', 'hidden')
        svg.appendChild(measurePath)

        svg.appendChild(ghostGroup)
        svg.appendChild(dashGroup)

        if (showLabel && !debug) {
          const label = document.createElementNS(
            'http://www.w3.org/2000/svg',
            'text',
          )
          label.setAttribute('class', 'eim-meander-line__label')
          label.setAttribute('text-anchor', 'middle')
          label.setAttribute('dominant-baseline', 'middle')
          label.setAttribute('opacity', '0')
          label.textContent = '900MHz'
          labelRef.current = label
          svg.appendChild(label)

          const len = measurePath.getTotalLength()
          if (len > 0) {
            const mid = measurePath.getPointAtLength(len * 0.5)
            label.setAttribute('x', String(mid.x))
            label.setAttribute('y', String(mid.y))
          }
        }

        svg.setAttribute('class', 'eim-path-art__svg')
        svg.removeAttribute('width')
        svg.removeAttribute('height')

        svgHostRef.current.innerHTML = ''
        svgHostRef.current.appendChild(svg)

        setDashCount(segments.length)
        setSvgReady(true)
      })
      .catch(() => {
        if (!cancelled) setSvgReady(false)
      })

    return () => {
      cancelled = true
      dashRefs.current = []
    }
  }, [showLabel])

  useEffect(() => {
    if (!dashDebug || !svgReady) {
      setDebugLabels([])
      return
    }

    let cancelled = false
    const frame = requestAnimationFrame(() => {
      if (cancelled) return
      setDebugLabels(measureDebugLabels())
    })

    return () => {
      cancelled = true
      cancelAnimationFrame(frame)
    }
  }, [dashDebug, svgReady, dashCount, measureDebugLabels])

  useEffect(() => {
    if (!svgReady || !active) {
      setGhostVisible(false)
      resetDashes()
      labelRef.current?.setAttribute('opacity', '0')
      return
    }

    if (dashDebug) {
      dashRefs.current.forEach((path) => {
        path.style.opacity = '0.35'
      })
      return
    }

    if (!triggerDraw || dashCount < 1) return

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduced) {
      setGhostVisible(true)
      dashRefs.current.forEach((path) => {
        path.style.opacity = '1'
      })
      labelRef.current?.setAttribute('opacity', '0.55')
      return
    }

    resetDashes()
    setGhostVisible(true)
    labelRef.current?.setAttribute('opacity', '0')

    const staggerMs = Math.max(8, drawDurationMs / dashCount)
    const timers: number[] = []

    dashRefs.current.forEach((path, index) => {
      const delay = GHOST_MS + index * staggerMs
      timers.push(
        window.setTimeout(() => {
          path.style.transition = `opacity ${DASH_FADE_MS}ms ${EIM_DRAW_EASE}`
          path.style.opacity = '1'

          if (index === dashRefs.current.length - 1) {
            labelRef.current?.setAttribute('opacity', '0.55')
          }
        }, delay),
      )
    })

    return () => {
      timers.forEach((id) => window.clearTimeout(id))
    }
  }, [
    active,
    triggerDraw,
    svgReady,
    dashCount,
    drawDurationMs,
    resetDashes,
    dashDebug,
  ])

  useEffect(() => {
    if (dashDebug) return
    const ghost = svgHostRef.current?.querySelector('.eim-path-art__ghost-dashes')
    if (ghost instanceof SVGGElement) {
      ghost.style.transition = `opacity ${GHOST_MS}ms ease`
      ghost.style.opacity = ghostVisible ? String(GHOST_OPACITY) : '0'
    }
  }, [ghostVisible, svgReady, dashDebug])

  return (
    <div
      className={[
        'eim-path-art',
        dashDebug ? 'eim-path-art--debug' : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {dashDebug ? (
        <p className="eim-path-art__debug-banner">
          Dash debug — reveal order 1→{dashCount || '…'}. Remove{' '}
          <code>?eimDashDebug=1</code> from the URL when done.
        </p>
      ) : null}
      <div className="eim-path-art__stage-wrap">
        <div
          ref={svgHostRef}
          className="eim-path-art__svg-host"
          aria-hidden={!svgReady}
        />
        {dashDebug && debugLabels.length > 0 ? (
          <div className="eim-path-art__debug-labels" aria-hidden>
            <span
              className="eim-path-art__debug-origin-html"
              style={{
                left: `${(EIM_TOUCH2_ORIGIN.x / EIM_PATH_VIEWBOX.width) * 100}%`,
                top: `${(EIM_TOUCH2_ORIGIN.y / EIM_PATH_VIEWBOX.height) * 100}%`,
              }}
              title="Touch 2 origin"
            />
            {debugLabels.map(({ order, x, y }) => (
              <span
                key={order}
                className="eim-path-art__debug-num-html"
                style={{
                  left: `${(x / EIM_PATH_VIEWBOX.width) * 100}%`,
                  top: `${(y / EIM_PATH_VIEWBOX.height) * 100}%`,
                }}
              >
                {order}
              </span>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  )
}
