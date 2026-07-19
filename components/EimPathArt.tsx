import { isPrerenderSnapshot } from '@/lib/isPrerenderSnapshot'
import {
  EIM_PATH_VIEWBOX,
  EIM_TIMING_RANGE,
  EIM_TOUCH2_ORIGIN,
  isEimDashDebugEnabled,
  isEimTimingDebugEnabled,
  readEimTiming,
  sortSubpathsByRevealOrder,
  splitPathSubpaths,
  subpathStartPoint,
  type EimTiming,
} from '@/lib/eimPathSegments'
import { useCallback, useEffect, useRef, useState } from 'react'

const SVG_SRC = '/images/devices/eimpath.svg'
const PATH_FILL = '#F5431B'
// Scrub zone: the cascade fills as the artifact's center rises from near the
// viewport bottom (DRAW_START) to the middle (DRAW_END = its center lock), so
// scrolling through the chapter always draws it — a fast pass can't skip it,
// the way every other chapter artifact's reveal already tracks scroll.
const DRAW_START_FRAC = 0.98
const DRAW_END_FRAC = 0.5
// Once fully drawn and the scroll has held still this long, the parked loop
// takes over from the scrub.
const LOOP_IDLE_MS = 220

type DebugLabel = { order: number; x: number; y: number }

interface Props {
  className?: string
}

export function EimPathArt({ className }: Props) {
  const svgHostRef = useRef<HTMLDivElement>(null)
  const dashRefs = useRef<SVGPathElement[]>([])
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

        const segments = sortSubpathsByRevealOrder(splitPathSubpaths(d))
        dashRefs.current = []

        const dashGroup = document.createElementNS(
          'http://www.w3.org/2000/svg',
          'g',
        )
        dashGroup.setAttribute('class', 'eim-path-art__dashes')
        // Draw amount (0–1) → per-dash opacity via calc (see globals.css).
        dashGroup.style.setProperty('--dash-total', String(segments.length))
        dashGroup.style.setProperty('--eim-draw', debug ? '1' : '0')

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
    if (!svgReady || dashCount < 1) return

    const host = svgHostRef.current
    const group = getDashGroup()
    if (!host || !group) return

    const setDraw = (v: number) =>
      group.style.setProperty('--eim-draw', v.toFixed(4))

    // Debug: hold every dash lit, no scrub/loop.
    if (dashDebug) {
      setDraw(1)
      return
    }

    const reduce = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches

    // Scroll position → fill amount. The artifact's center rises to the middle
    // of the viewport (its center lock) as the chapter scrolls in; map that
    // travel to 0→1. Clamped, so it holds full while pinned and through the
    // exit fade, and reverses symmetrically on scroll-up.
    const progress = () => {
      const r = host.getBoundingClientRect()
      const vh = window.innerHeight || 1
      const center = r.top + r.height / 2
      const start = DRAW_START_FRAC * vh
      const end = DRAW_END_FRAC * vh
      const p = (start - center) / (start - end || 1)
      return p < 0 ? 0 : p > 1 ? 1 : p
    }

    // Parked-loop fill for a given elapsed time: start lit, undraw over fade,
    // hold dark, draw back over drawMs, hold lit — the owner-tuned cycle.
    const { drawMs, holdMs, fadeMs } = timing
    const period = fadeMs + holdMs + drawMs + holdMs
    const loopFill = (elapsed: number) => {
      let t = period > 0 ? elapsed % period : 0
      if (t < fadeMs) return 1 - t / (fadeMs || 1)
      t -= fadeMs
      if (t < holdMs) return 0
      t -= holdMs
      if (t < drawMs) return t / (drawMs || 1)
      return 1
    }

    let scrubRaf = 0
    let loopRaf = 0
    let idleTimer = 0
    let looping = false
    let loopStart = 0

    const loopTick = () => {
      setDraw(loopFill(performance.now() - loopStart))
      loopRaf = requestAnimationFrame(loopTick)
    }
    const startLoop = () => {
      if (looping) return
      looping = true
      loopStart = performance.now()
      loopTick()
    }
    const stopLoop = () => {
      looping = false
      if (loopRaf) cancelAnimationFrame(loopRaf)
      loopRaf = 0
    }

    const scrub = () => {
      const p = progress()
      setDraw(p)
      window.clearTimeout(idleTimer)
      // Only fully drawn and settled (parked at/after the center lock) does the
      // ambient cycle kick in; mid-scroll it stays scroll-locked.
      if (!reduce && p > 0.999) {
        idleTimer = window.setTimeout(startLoop, LOOP_IDLE_MS)
      }
    }

    const onScroll = () => {
      stopLoop()
      if (scrubRaf) return
      scrubRaf = requestAnimationFrame(() => {
        scrubRaf = 0
        scrub()
      })
    }

    scrub()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)

    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      stopLoop()
      if (scrubRaf) cancelAnimationFrame(scrubRaf)
      window.clearTimeout(idleTimer)
    }
  }, [svgReady, dashCount, timing, dashDebug, getDashGroup])

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
            Parked-loop timing (the draw itself scrubs to scroll). Cycle ≈{' '}
            {timing.fadeMs + timing.holdMs + timing.drawMs + timing.holdMs}ms ·{' '}
            <code>?eimTiming=1&amp;eimDraw={timing.drawMs}&amp;eimHold={timing.holdMs}&amp;eimFade={timing.fadeMs}</code>
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
