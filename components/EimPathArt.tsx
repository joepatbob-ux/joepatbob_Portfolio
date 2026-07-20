import { isPrerenderSnapshot } from '@/lib/isPrerenderSnapshot'
import {
  EIM_PATH_VIEWBOX,
  EIM_TIMING_RANGE,
  EIM_TOUCH2_ORIGIN,
  isEimDashDebugEnabled,
  isEimTimingDebugEnabled,
  readEimTiming,
  splitPathSubpaths,
  subpathStartPoint,
  type EimTiming,
} from '@/lib/eimPathSegments'
import { useCallback, useEffect, useRef, useState } from 'react'

const SVG_SRC = '/images/devices/eimpath.svg'
const PATH_FILL = '#F5431B'
const DASH_STAGGER_MIN_MS = 4

type DebugLabel = { order: number; x: number; y: number }

interface Props {
  active?: boolean
  triggerDraw?: boolean
  className?: string
}

export function EimPathArt({
  active = true,
  triggerDraw = true,
  className,
}: Props) {
  const svgHostRef = useRef<HTMLDivElement>(null)
  const dashRefs = useRef<SVGPathElement[]>([])
  const illuminatedRef = useRef(false)
  const [dashDebug, setDashDebug] = useState(false)
  const [timingDebug, setTimingDebug] = useState(false)
  const [timing, setTiming] = useState<EimTiming>(readEimTiming)
  const [dashCount, setDashCount] = useState(0)
  const [debugLabels, setDebugLabels] = useState<DebugLabel[]>([])
  const [svgReady, setSvgReady] = useState(false)

  useEffect(() => {
    setDashDebug(isEimDashDebugEnabled())
    setTimingDebug(isEimTimingDebugEnabled())
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
    // Keep the snapshot host empty: baking the injected SVG freezes a stale
    // reveal state that hydration would adopt and the dash system can't drive.
    if (isPrerenderSnapshot()) return

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

        // Dashes in eimpath.svg are authored in reveal order (1→70 along the
        // connector); splitting the path preserves that order.
        const segments = splitPathSubpaths(d)
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
      timing.drawMs / Math.max(dashCount, 1),
    )
    const fadeMs = timing.fadeMs
    const phaseDuration =
      (dashCount - 1) * staggerMs + fadeMs + timing.holdMs

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
      if (dashDebug || !illuminatedRef.current) {
        resetDashes()
        return clearTimers
      }

      // Exit is passive: the chapter's own blur/fade carries the lit art out —
      // de-drawing (or snapping dark) while still on screen reads as the art
      // ignoring the fade. Reset instantly, but only once genuinely hidden,
      // so the next entry re-draws from dark.
      const host = svgHostRef.current
      const hidden = () => {
        if (!host || !host.isConnected) return true
        const rect = host.getBoundingClientRect()
        if (rect.bottom < 0 || rect.top > window.innerHeight) return true
        for (
          let el: HTMLElement | null = host;
          el && !el.classList.contains('portfolio-chapter-slot');
          el = el.parentElement
        ) {
          const cs = getComputedStyle(el)
          if (Number(cs.opacity) <= 0.05 || cs.visibility === 'hidden') {
            return true
          }
        }
        return false
      }
      const waitForHidden = () => {
        if (cancelled) return
        if (hidden()) {
          resetDashes()
          return
        }
        schedule(waitForHidden, 160)
      }
      waitForHidden()
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

    // Cycle while the chapter is on screen: draw the cascade on, hold, fade it
    // back off, then redraw — repeating until the chapter leaves (active flips
    // false), at which point the passive-exit branch above lets the chapter's
    // own fade carry out whatever state the loop is in.
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
    timing,
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
      {timingDebug ? (
        <div className="eim-path-art__timing" role="group" aria-label="EIM timing tuner">
          <p className="eim-path-art__timing-title">EIM timing</p>
          {(
            [
              ['drawMs', 'Draw sweep'],
              ['holdMs', 'Hold'],
              ['fadeMs', 'Fade'],
            ] as const
          ).map(([key, label]) => (
            <label key={key} className="eim-path-art__timing-row">
              <span className="eim-path-art__timing-label">{label}</span>
              <input
                type="range"
                min={EIM_TIMING_RANGE[key].min}
                max={EIM_TIMING_RANGE[key].max}
                step={EIM_TIMING_RANGE[key].step}
                value={timing[key]}
                onChange={(e) =>
                  setTiming((t) => ({ ...t, [key]: Number(e.target.value) }))
                }
              />
              <span className="eim-path-art__timing-value">{timing[key]}ms</span>
            </label>
          ))}
          <p className="eim-path-art__timing-share">
            Cycle ≈{' '}
            {Math.round(
              (Math.max(DASH_STAGGER_MIN_MS, timing.drawMs / Math.max(dashCount, 1)) *
                (dashCount - 1) +
                timing.fadeMs +
                timing.holdMs) *
                2,
            )}
            ms · <code>?eimTiming=1&amp;eimDraw={timing.drawMs}&amp;eimHold={timing.holdMs}&amp;eimFade={timing.fadeMs}</code>
          </p>
        </div>
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
