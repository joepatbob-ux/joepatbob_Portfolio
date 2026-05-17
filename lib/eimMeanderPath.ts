/** Normalized waypoint: progress t ∈ [0, 1], lateral offset ∈ [-1, 1]. */
type NormPoint = readonly [number, number]

export type PathPoint = { x: number; y: number }

export type RectSide = 'top' | 'right' | 'bottom' | 'left'

const WAYPOINT_CACHE = new Map<number, NormPoint[]>()

function mulberry32(seed: number) {
  let s = seed | 0
  return () => {
    s = (s + 0x6d2b79f5) | 0
    let t = Math.imul(s ^ (s >>> 15), 1 | s)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Bil Keane–style troupe trail between two anchors. */
export function generateTroupeWaypoints(seed: number): NormPoint[] {
  const cached = WAYPOINT_CACHE.get(seed)
  if (cached) return cached

  const rand = mulberry32(seed)
  const jitter = (n: number, spread: number) => n + (rand() - 0.5) * spread
  const pick = (min: number, max: number) => min + rand() * (max - min)

  const pts: NormPoint[] = [[0, 0]]

  const walk = (t: number, x: number) => {
    const last = pts[pts.length - 1][0]
    if (t > last + 0.015) {
      pts.push([Math.min(0.995, t), Math.max(-1, Math.min(1, x))])
    }
  }

  walk(0.06, pick(-0.35, -0.15))
  walk(0.11, pick(-0.95, -0.55))

  const loop1T = jitter(0.2, 0.04)
  const loop1X = jitter(-0.72, 0.12)
  const loop1Rx = pick(0.28, 0.42)
  const loop1Rt = pick(0.035, 0.055)
  const loop1Steps = 7 + Math.floor(rand() * 3)
  const loop1Start = rand() * Math.PI * 2
  for (let i = 0; i <= loop1Steps; i++) {
    const a = loop1Start + (i / loop1Steps) * Math.PI * 2
    pts.push([
      Math.min(0.995, loop1T + Math.sin(a) * loop1Rt),
      Math.max(-1, Math.min(1, loop1X + Math.cos(a) * loop1Rx)),
    ])
  }

  walk(0.34, pick(-0.88, -0.35))
  walk(0.42, pick(-0.55, -0.1))
  walk(0.48, pick(-0.75, -0.4))

  const loop2T = jitter(0.64, 0.05)
  const loop2X = jitter(-0.48, 0.14)
  const loop2Rx = pick(0.72, 0.98)
  const loop2Rt = pick(0.1, 0.15)
  const loop2Steps = 11 + Math.floor(rand() * 4)
  const loop2Start = pick(-Math.PI * 0.35, Math.PI * 0.2)
  for (let i = 0; i <= loop2Steps; i++) {
    const a = loop2Start + (i / loop2Steps) * Math.PI * 2
    pts.push([
      Math.min(0.995, loop2T + Math.sin(a) * loop2Rt),
      Math.max(-1, Math.min(1, loop2X + Math.cos(a) * loop2Rx)),
    ])
  }

  walk(0.82, pick(-0.25, 0.35))
  walk(0.9, pick(0.05, 0.55))
  walk(0.96, pick(-0.15, 0.25))
  pts.push([1, 0])

  WAYPOINT_CACHE.set(seed, pts)
  return pts
}

/** Pick exit/entry sides so the path faces from one asset toward the other. */
export function pickConnectionSides(
  from: DOMRect,
  to: DOMRect,
): { exit: RectSide; enter: RectSide } {
  const fromCx = from.left + from.width / 2
  const fromCy = from.top + from.height / 2
  const toCx = to.left + to.width / 2
  const toCy = to.top + to.height / 2
  const dx = toCx - fromCx
  const dy = toCy - fromCy

  const exit: RectSide =
    Math.abs(dx) > Math.abs(dy)
      ? dx > 0
        ? 'right'
        : 'left'
      : dy > 0
        ? 'bottom'
        : 'top'

  const enter: RectSide =
    Math.abs(dx) > Math.abs(dy)
      ? dx > 0
        ? 'left'
        : 'right'
      : dy > 0
        ? 'top'
        : 'bottom'

  return { exit, enter }
}

export function anchorOnRect(
  rect: DOMRect,
  side: RectSide,
  origin: { x: number; y: number },
): PathPoint {
  const x = rect.left - origin.x
  const y = rect.top - origin.y
  switch (side) {
    case 'top':
      return { x: x + rect.width / 2, y }
    case 'bottom':
      return { x: x + rect.width / 2, y: y + rect.height }
    case 'left':
      return { x, y: y + rect.height / 2 }
    case 'right':
      return { x: x + rect.width, y: y + rect.height / 2 }
  }
}

function catmullRomToBezier(points: PathPoint[]): string {
  if (points.length < 2) return ''
  if (points.length === 2) {
    return `M ${points[0].x.toFixed(2)} ${points[0].y.toFixed(2)} L ${points[1].x.toFixed(2)} ${points[1].y.toFixed(2)}`
  }

  const parts: string[] = [
    `M ${points[0].x.toFixed(2)} ${points[0].y.toFixed(2)}`,
  ]

  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[Math.max(0, i - 1)]
    const p1 = points[i]
    const p2 = points[i + 1]
    const p3 = points[Math.min(points.length - 1, i + 2)]

    const cp1x = p1.x + (p2.x - p0.x) / 6
    const cp1y = p1.y + (p2.y - p0.y) / 6
    const cp2x = p2.x - (p3.x - p1.x) / 6
    const cp2y = p2.y - (p3.y - p1.y) / 6

    parts.push(
      `C ${cp1x.toFixed(2)} ${cp1y.toFixed(2)} ${cp2x.toFixed(2)} ${cp2y.toFixed(2)} ${p2.x.toFixed(2)} ${p2.y.toFixed(2)}`,
    )
  }

  return parts.join(' ')
}

function sliceNormPoints(norm: NormPoint[], tStart: number, tEnd: number): NormPoint[] {
  const slice = norm.filter(([t]) => t >= tStart - 0.001 && t <= tEnd + 0.001)
  if (slice.length >= 2) return slice
  return [
    [tStart, 0],
    [tEnd, 0],
  ]
}

/** Map troupe waypoints onto the segment between two asset anchors. */
export function buildAssetTroupePath(
  start: PathPoint,
  end: PathPoint,
  wander: number,
  pathSeed: number,
  tStart = 0,
  tEnd = 1,
): PathPoint[] {
  const norm = sliceNormPoints(generateTroupeWaypoints(pathSeed), tStart, tEnd)
  const dx = end.x - start.x
  const dy = end.y - start.y
  const len = Math.hypot(dx, dy) || 1
  const ux = dx / len
  const uy = dy / len
  const px = -uy
  const py = ux
  const n = norm.length - 1 || 1

  return norm.map(([_, xn], i) => {
    const t = i / n
    const along = t * len
    return {
      x: start.x + ux * along + px * xn * wander,
      y: start.y + uy * along + py * xn * wander,
    }
  })
}

export function buildAssetTroupePathD(
  start: PathPoint,
  end: PathPoint,
  wander: number,
  pathSeed: number,
  tStart = 0,
  tEnd = 1,
): string {
  const points = buildAssetTroupePath(start, end, wander, pathSeed, tStart, tEnd)
  if (points.length < 2) return ''
  return catmullRomToBezier(points)
}

export function troupePathMidpoint(points: PathPoint[]): PathPoint {
  if (points.length === 0) return { x: 0, y: 0 }
  return points[Math.floor(points.length / 2)]
}

export function wanderForSpan(span: number, ratio = 0.14): number {
  return Math.max(28, Math.min(72, span * ratio))
}

export function createEimPathSeed(): number {
  return Math.floor(Math.random() * 0x7fffffff)
}

/** Vertical sine meander — 3 cycles over `height`. */
export function buildEimMeanderPath(
  height: number,
  amplitude: number,
  centerX: number,
): string {
  const cycles = 3
  const steps = Math.max(24, Math.round(height / 12))
  const parts: string[] = []

  for (let i = 0; i <= steps; i++) {
    const t = i / steps
    const y = t * height
    const x = centerX + Math.sin(t * cycles * Math.PI * 2) * amplitude
    parts.push(
      `${i === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)}`,
    )
  }

  return parts.join(' ')
}

export function eimMeanderMidpoint(
  height: number,
  amplitude: number,
  centerX: number,
): PathPoint {
  const t = 0.5
  return {
    x: centerX + Math.sin(t * 3 * Math.PI * 2) * amplitude,
    y: height * t,
  }
}

export const EIM_LINE_STROKE = '#C45C00'
export const EIM_LINE_DASH = '5 13'
export const EIM_LINE_WIDTH = 3
export const EIM_DRAW_EASE = 'cubic-bezier(0.16, 1, 0.3, 1)'
