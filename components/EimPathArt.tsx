import {
  EIM_PATH_VIEWBOX,
  EIM_TOUCH2_ORIGIN,
  isEimDashDebugEnabled,
  sortSubpathsByRevealOrder,
  splitPathSubpaths,
  subpathStartPoint,
} from '@/lib/eimPathSegments'
import { useCallback, useEffect, useRef, useState } from 'react'

const SVG_SRC = '/images/devices/eimpath.svg'
const PATH_FILL = '#F5431B'
const CYCLE_HOLD_MS = 600
const DASH_FADE_MIN_MS = 360
const DASH_FADE_MAX_MS = 520
const DASH_STAGGER_MIN_MS = 28

type DebugLabel = { order: number; x: number; y: number }

interface Props {
  active?: boolean
  triggerDraw?: boolean
  drawDurationMs?: number
  className?: string
}

export function EimPathArt({
  active = true,
  triggerDraw = true,
  drawDurationMs = 3000,
  className,
}: Props) {
  const svgHostRef = useRef<HTMLDivElement>(null)
  const dashRefs = useRef<SVGPathElement[]>([])
  const illuminatedRef = useRef(false)
  const [dashDebug, setDashDebug] = useState(false)
  const [dashCount, setDashCount] = useState(0)
  const [debugLabels, setDebugLabels] = useState<DebugLabel[]>([])
  const [svgReady, setSvgReady] = useState(false)

  useEffect(() => {
    setDashDebug(isEimDashDebugEnabled())
  }, [])

  const getDashGroup = useCallback(() => {
    const group = svgHostRef.current?.querySelector('.eim-path-art__dashes')
    return group instanceof SVGGElement ? group : null
  }, [])

  const setDashPhase = useCallback(
    (phase: 'on' | 'off', instant = false) => {
      const group = getDashGroup()
      const root = svgHostRef.current
      if (!group || !root) return

      if (instant) {
        root.classList.add('eim-path-art--instant')
        group.setAttribute('data-phase', phase)
        requestAnimationFrame(() => {
          requestAnimationFrame(() => root.classList.remove('eim-path-art--instant'))
        })
        return
      }

      group.setAttribute('data-phase', phase)
    },
    [getDashGroup],
  )

  const resetDashes = useCallback(() => {
    setDashPhase('off', true)
    illuminatedRef.current = false
  }, [setDashPhase])

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
      .then((res) => {
        if (!res.ok) {
          throw new Error(`EIM path SVG failed (${res.status})`)
        }
        return res.text()
      })
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

        const dashGroup = document.createElementNS(
          'http://www.w3.org/2000/svg',
          'g',
        )
        dashGroup.setAttribute('class', 'eim-path-art__dashes')
        dashGroup.setAttribute('data-phase', debug ? 'on' : 'off')

        segments.forEach((segment, index) => {
          const dash = document.createElementNS(
            'http://www.w3.org/2000/svg',
            'path',
          )
          dash.setAttribute('d', segment)
          dash.setAttribute('fill', PATH_FILL)
          dash.setAttribute('class', 'eim-path-art__dash')
          dash.style.setProperty('--dash-index', String(index))

          dashGroup.appendChild(dash)
          dashRefs.current.push(dash)
        })

        svg.appendChild(dashGroup)

        svg.setAttribute('class', 'eim-path-art__svg')
        svg.removeAttribute('width')
        svg.removeAttribute('height')

        svgHostRef.current.innerHTML = ''
        svgHostRef.current.appendChild(svg)

        setDashCount(segments.length)
        setSvgReady(true)
      })
      .catch((err) => {
        if (cancelled) return
        setSvgReady(false)
        if (import.meta.env.DEV) {
          console.warn('[EimPathArt] Failed to load path SVG:', err)
        }
      })

    return () => {
      cancelled = true
      dashRefs.current = []
    }
  }, [])

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
    if (!svgReady) return

    const root = svgHostRef.current
    if (!root) return

    const staggerMs = Math.max(
      DASH_STAGGER_MIN_MS,
      drawDurationMs / Math.max(dashCount, 1),
    )
    const fadeMs = Math.min(
      DASH_FADE_MAX_MS,
      Math.max(DASH_FADE_MIN_MS, staggerMs * 3.6),
    )
    const phaseDuration =
      (dashCount - 1) * staggerMs + fadeMs + CYCLE_HOLD_MS

    root.style.setProperty('--dash-stagger', `${staggerMs}ms`)
    root.style.setProperty('--dash-fade', `${fadeMs}ms`)

    let cancelled = false
    const timers: number[] = []

    const schedule = (fn: () => void, delay: number) => {
      timers.push(
        window.setTimeout(() => {
          if (!cancelled) fn()
        }, delay),
      )
    }

    const runTurnOn = (then: () => void) => {
      const group = getDashGroup()
      const alreadyOff = group?.getAttribute('data-phase') === 'off'
      if (!alreadyOff) setDashPhase('off', true)
      schedule(() => {
        setDashPhase('on')
        illuminatedRef.current = true
        schedule(then, phaseDuration)
      }, alreadyOff ? 0 : 32)
    }

    const runTurnOff = (then: () => void) => {
      if (!illuminatedRef.current) {
        then()
        return
      }
      setDashPhase('off')
      schedule(() => {
        illuminatedRef.current = false
        then()
      }, phaseDuration)
    }

    const clearTimers = () => {
      cancelled = true
      timers.forEach((id) => window.clearTimeout(id))
    }

    if (!active) {
      if (dashDebug) {
        resetDashes()
        return clearTimers
      }

      if (illuminatedRef.current) {
        runTurnOff(() => resetDashes())
        return clearTimers
      }

      resetDashes()
      return clearTimers
    }

    if (dashDebug) return clearTimers

    if (!triggerDraw || dashCount < 1) return clearTimers

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduced) {
      setDashPhase('on', true)
      illuminatedRef.current = true
      return clearTimers
    }

    const loop = () => {
      if (cancelled || !active) return
      runTurnOn(() => {
        if (cancelled || !active) return
        runTurnOff(() => {
          if (cancelled || !active) return
          loop()
        })
      })
    }

    loop()

    return clearTimers
  }, [
    active,
    triggerDraw,
    svgReady,
    dashCount,
    drawDurationMs,
    resetDashes,
    dashDebug,
    setDashPhase,
    getDashGroup,
  ])

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
          aria-hidden
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
