// Gooey particle engine for the interlude: one conserved cloud of motes that
// settles into four dense dot-glyphs, disperses into a loose cloud between, and
// merges as sticky fluid (metaball blur + alpha threshold). Ported from the
// tuning prototype; all magic numbers come in through GlyphDustRecipe.

import { GLYPH_DEFS, GLYPH_LABELS, GLYPH_ORDER, type GlyphDef } from '@/lib/glyph-dust/glyphData'

export interface GlyphDustChromeTune {
  /** Chromium blur multiplier on recipe.goo (Safari ignores). */
  gooMult: number
  /** Chromium alpha threshold after blur (Safari uses 96). */
  threshold: number
}

export interface GlyphDustRecipe {
  /** dots per unit² in a settled glyph (sizes the shared pool off the largest form) */
  shapeDens: number
  /** dot radius (world units) when packed into a shape */
  dotSize: number
  /** dot radius (world units) mid-transit between shapes */
  cloudDot: number
  /** ms held as each dense glyph */
  hold: number
  /** ms of the flow morphing one glyph directly into the next */
  flow: number
  /** 0–1 spread of per-mote departure times */
  stagger: number
  /** 0–1 mid-flight size flicker */
  shimmer: number
  /** metaball blur px at half-res (0 = crisp round droplets, higher = stickier fluid) */
  goo: number
  /** how far transit paths bow (world units) — organic flow, no central cloud */
  curve: number
  /** count of free-floating specks that never merge (personality) */
  errant: number
  /** hard cap on the mote pool (perf guard) */
  maxMotes?: number
  /** Optional Chromium goo pass overrides (ignored on Safari). */
  chrome?: GlyphDustChromeTune
}

interface Mote {
  pos: [number, number][] // one [x,y] per glyph
  delay: number
  curve: number // signed perpendicular bow of this mote's transit path
  sizeJit: number
  alpha: number
  spin: number
}

interface Errant {
  bx: number
  by: number
  ax: number
  ay: number
  sx: number
  sy: number
  px: number
  py: number
  r: number
  alpha: number
}

export interface GlyphDustHandle {
  start(): void
  stop(): void
  /** paint a single settled frame (reduced-motion / static fallback) */
  renderStatic(): void
  /** debug: freeze cycle and render at phase 0–1 */
  seekPhase(p: number): void
  /** debug: resume the animation loop from the current phase */
  resumeCycle(): void
  /** debug: whether the cycle is frozen */
  isPaused(): boolean
  destroy(): void
}

const VIEW = 28
const easeIO = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)
/** Finish morph in the first fraction of the flow window; remaining flow time settles at target before leg index rolls. */
const MORPH_TAIL = 0.86

function mulberry32(a: number) {
  return function () {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
function hexRGB(h: string): [number, number, number] {
  h = h.trim().replace('#', '')
  if (h.length === 3)
    h = h
      .split('')
      .map((c) => c + c)
      .join('')
  const n = parseInt(h, 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}
function circleToPath(cx: number, cy: number, r: number) {
  return `M ${cx + r} ${cy} A ${r} ${r} 0 1 1 ${cx - r} ${cy} A ${r} ${r} 0 1 1 ${cx + r} ${cy} Z`
}
function subpaths(d: string) {
  return d.split(/(?=[Mm])/).map((s) => s.trim()).filter(Boolean)
}
function centroid(pts: [number, number][]): [number, number] {
  let x = 0, y = 0
  for (const p of pts) {
    x += p[0]
    y += p[1]
  }
  const n = pts.length || 1
  return [x / n, y / n]
}
/** Sort key: angle around centroid, then radius — keeps morph partners spatially local. */
function morphKey(p: [number, number], c: [number, number]) {
  const dx = p[0] - c[0], dy = p[1] - c[1]
  return Math.atan2(dy, dx) * 1000 + Math.hypot(dx, dy)
}

export function createGlyphDust(
  canvas: HTMLCanvasElement,
  recipe: GlyphDustRecipe,
): GlyphDustHandle {
  const ctx = canvas.getContext('2d')!
  const W = canvas.width
  const SCALE = W / VIEW
  const w2c = (x: number, y: number): [number, number] => [SCALE * (x + 2), SCALE * (y + 2)]
  const MASKRES = 14
  const MASKN = 24 * MASKRES
  const HALF = Math.round(W * 0.56)
  const KH = HALF / W
  const needsChromiumGooTune =
    typeof navigator !== 'undefined' &&
    !(
      /Safari/i.test(navigator.userAgent) &&
      !/Chrome|Chromium|Edg/i.test(navigator.userAgent)
    )
  const chromeGooMult = recipe.chrome?.gooMult ?? 0.65
  const chromeThreshold = recipe.chrome?.threshold ?? 110

  // detached SVG for path sampling
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
  svg.setAttribute('style', 'position:absolute;width:0;height:0;overflow:hidden')
  document.body.appendChild(svg)
  function samplePath(
    d: string,
    n: number,
    scale = 1,
    dx = 0,
    dy = 0,
  ): [number, number][] {
    const el = document.createElementNS('http://www.w3.org/2000/svg', 'path')
    el.setAttribute('d', d)
    svg.appendChild(el)
    const len = el.getTotalLength()
    const pts: [number, number][] = []
    for (let i = 0; i < n; i++) {
      const p = el.getPointAtLength((len * i) / n)
      pts.push([p.x * scale + dx, p.y * scale + dy])
    }
    el.remove()
    return pts
  }

  // Normalize a glyph into the 24-unit mask space and rasterize its silhouette.
  // Every subpath of every shape is added to one Path2D; even-odd fill turns the
  // inner subpaths (screen marks, dots, mouth) into cutouts. This handles both
  // the single-path-with-holes glyphs and multi-path glyphs uniformly.
  function prep(def: GlyphDef): Path2D {
    const [, , w, h] = def.viewBox.split(' ').map(Number)
    const TARGET = 20 // fit the glyph within a 20-unit box, centered in 24
    const scale = TARGET / Math.max(w, h)
    const dx = (24 - w * scale) / 2, dy = (24 - h * scale) / 2
    const paths = def.shapes.map((s) =>
      s.type === 'circle' ? circleToPath(s.cx!, s.cy!, s.r!) : s.d!,
    )
    const p2d = new Path2D()
    const add = (pts: [number, number][]) => {
      p2d.moveTo(pts[0][0], pts[0][1])
      for (let i = 1; i < pts.length; i++) p2d.lineTo(pts[i][0], pts[i][1])
      p2d.closePath()
    }
    for (const d of paths) {
      for (const sp of subpaths(d)) add(samplePath(sp, 200, scale, dx, dy))
    }
    return p2d
  }

  const GL = GLYPH_ORDER.map((name) => prep(GLYPH_DEFS[name]))

  // one-time coverage masks (O(1) point-in-shape)
  function buildMask(p2d: Path2D): Uint8Array {
    const c = document.createElement('canvas')
    c.width = MASKN
    c.height = MASKN
    const x = c.getContext('2d')!
    x.setTransform(MASKRES, 0, 0, MASKRES, 0, 0)
    x.fillStyle = '#000'
    x.fill(p2d, 'evenodd')
    const d = x.getImageData(0, 0, MASKN, MASKN).data
    const m = new Uint8Array(MASKN * MASKN)
    for (let i = 0; i < m.length; i++) m[i] = d[i * 4 + 3] > 10 ? 1 : 0
    return m
  }
  const MASKS = GL.map(buildMask)
  const inGlyph = (mask: Uint8Array, lx: number, ly: number) => {
    const px = (lx * MASKRES) | 0, py = (ly * MASKRES) | 0
    if (px < 0 || py < 0 || px >= MASKN || py >= MASKN) return false
    return mask[py * MASKN + px] === 1
  }
  function gridPoints(mask: Uint8Array, spacing: number, seed: number): [number, number][] {
    const rnd = mulberry32(seed)
    const pts: [number, number][] = []
    for (let y = 0; y < 24; y += spacing) {
      for (let x = 0; x < 24; x += spacing) {
        const lx = x + (rnd() - 0.5) * spacing, ly = y + (rnd() - 0.5) * spacing
        if (inGlyph(mask, lx, ly)) pts.push([lx, ly])
      }
    }
    return pts
  }
  function pairMap(A: [number, number][], B: [number, number][]): number[] {
    const ca = centroid(A), cb = centroid(B)
    const ai = A.map((_, i) => i).sort((p, q) => morphKey(A[p], ca) - morphKey(A[q], ca))
    const bi = B.map((_, i) => i).sort((p, q) => morphKey(B[p], cb) - morphKey(B[q], cb))
    const out = new Array<number>(A.length)
    for (let r = 0; r < A.length; r++) out[ai[r]] = bi[r]
    return out
  }

  function subsampleEven(pts: [number, number][], n: number): [number, number][] {
    if (pts.length <= n) return pts
    const c = centroid(pts)
    const order = pts
      .map((_, i) => i)
      .sort((p, q) => morphKey(pts[p], c) - morphKey(pts[q], c))
    const out: [number, number][] = []
    for (let k = 0; k < n; k++) {
      const src = order[Math.floor((k * order.length) / n)]!
      out.push(pts[src]!)
    }
    return out
  }

  /** Pad or thin each glyph to exactly n motes without top-heavy grid-order bias. */
  function normalizePointCount(
    pts: [number, number][],
    n: number,
    spacing: number,
    seed: number,
  ): [number, number][] {
    if (!pts.length) return pts
    if (pts.length > n) return subsampleEven(pts, n)
    if (pts.length === n) return pts
    const out = pts.slice()
    const rnd = mulberry32(seed)
    while (out.length < n) {
      const src = pts[(rnd() * pts.length) | 0]!
      out.push([src[0] + (rnd() - 0.5) * spacing, src[1] + (rnd() - 0.5) * spacing])
    }
    return out
  }

  let DOTS: Mote[] = []
  let N = 0
  function buildDots() {
    let spacing = 1 / Math.sqrt(recipe.shapeDens)
    let P = MASKS.map((m, i) => gridPoints(m, spacing, 31 + i * 13))
    let max = Math.max(...P.map((p) => p.length))
    // perf guard: thin out uniformly if the pool would exceed the cap
    const cap = recipe.maxMotes ?? 32000
    if (max > cap) {
      spacing *= Math.sqrt(max / cap)
      P = MASKS.map((m, i) => gridPoints(m, spacing, 31 + i * 13))
      max = Math.max(...P.map((p) => p.length))
    }
    N = max
    P = P.map((p, i) => normalizePointCount(p, N, spacing, 555 + i * 17))
    const m01 = pairMap(P[0], P[1]), m12 = pairMap(P[1], P[2]), m23 = pairMap(P[2], P[3])
    const rnd = mulberry32(777)
    DOTS = new Array(N)
    for (let k = 0; k < N; k++) {
      const a = P[0][k], b = P[1][m01[k]], c = P[2][m12[m01[k]]], d = P[3][m23[m12[m01[k]]]]
      DOTS[k] = {
        pos: [a, b, c, d],
        delay: rnd(),
        curve: (rnd() - 0.5) * 2,
        sizeJit: 0.65 + rnd() * 0.7,
        alpha: 0.72 + rnd() * 0.28,
        spin: rnd() * Math.PI * 2,
      }
    }
  }

  // ── errant specks: a handful of free motes that never merge into the goo ──
  let ERRANT: Errant[] = []
  function buildErrant() {
    const rnd = mulberry32(9001)
    const n = Math.max(0, Math.round(recipe.errant))
    ERRANT = new Array(n)
    for (let k = 0; k < n; k++) {
      ERRANT[k] = {
        bx: rnd() * W,
        by: rnd() * canvas.height,
        ax: (0.1 + rnd() * 0.28) * W,
        ay: (0.1 + rnd() * 0.28) * canvas.height,
        sx: (0.00012 + rnd() * 0.00035) * (rnd() < 0.5 ? -1 : 1),
        sy: (0.00012 + rnd() * 0.00035) * (rnd() < 0.5 ? -1 : 1),
        px: rnd() * Math.PI * 2,
        py: rnd() * Math.PI * 2,
        r: (0.06 + rnd() * 0.11) * SCALE,
        alpha: 0.35 + rnd() * 0.5,
      }
    }
  }

  // ── accent (cached, updated on theme change) ────────────────────
  let accentHex = '#C93512'
  let accentRGB: [number, number, number] = [201, 53, 18]
  function refreshAccent() {
    const v = getComputedStyle(document.documentElement).getPropertyValue('--color-accent').trim()
    if (v) {
      accentHex = v
      accentRGB = hexRGB(v)
    }
  }
  refreshAccent()
  const themeObs = new MutationObserver(refreshAccent)
  themeObs.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })
  const mq = window.matchMedia('(prefers-color-scheme: dark)')
  const onMq = () => refreshAccent()
  mq.addEventListener('change', onMq)

  // half-res goo buffers
  const gaCanvas = document.createElement('canvas')
  gaCanvas.width = HALF
  gaCanvas.height = HALF
  const gaCtx = gaCanvas.getContext('2d', { willReadFrequently: true })!
  const gbCanvas = document.createElement('canvas')
  gbCanvas.width = HALF
  gbCanvas.height = HALF
  const gbCtx = gbCanvas.getContext('2d', { willReadFrequently: true })!

  function render() {
    ctx.setTransform(1, 0, 0, 1, 0, 0)
    ctx.clearRect(0, 0, W, canvas.height)
    const col = accentHex
    const legLen = recipe.hold + recipe.flow, holdFrac = recipe.hold / legLen
    // Monotonic cycle time — avoids modulo skip/snap at morph ends and cycle wrap.
    const cycle = clock / total
    const x4 = cycle * 4
    const leg = Math.floor(x4)
    const i = ((leg % 4) + 4) % 4
    const f = x4 - leg
    const j = (i + 1) % 4
    const span = Math.max(0.25, 1 - recipe.stagger)
    const morphFtEnd = span + recipe.stagger
    let flowing = false, ft = 0
    if (f >= holdFrac) {
      flowing = true
      const raw = (f - holdFrac) / (1 - holdFrac)
      ft = Math.min(morphFtEnd, (raw / MORPH_TAIL) * morphFtEnd)
    }
    const goo = recipe.goo >= 1

    if (goo) {
      gaCtx.setTransform(1, 0, 0, 1, 0, 0)
      gaCtx.clearRect(0, 0, HALF, HALF)
      gaCtx.globalAlpha = 1
      gaCtx.fillStyle = col
    } else {
      ctx.fillStyle = col
    }

    for (const dot of DOTS) {
      let x: number, y: number, disp = 0
      if (!flowing) {
        x = dot.pos[i][0]
        y = dot.pos[i][1]
      } else {
        // Direct morph A→B along a gently bowed path (no central cloud gather).
        const A = dot.pos[i], B = dot.pos[j]
        const lt = Math.max(0, Math.min(1, (ft - dot.delay * recipe.stagger) / span))
        if (lt >= 1) {
          x = B[0]
          y = B[1]
          disp = 0
        } else if (lt <= 0) {
          x = A[0]
          y = A[1]
          disp = 0
        } else {
          disp = Math.sin(Math.PI * lt)
          const e = easeIO(lt)
          const mx = (A[0] + B[0]) / 2, my = (A[1] + B[1]) / 2
          const dx = B[0] - A[0], dy = B[1] - A[1]
          const len = Math.hypot(dx, dy) || 1
          const amp = dot.curve * recipe.curve * Math.min(1, 3.2 / len)
          const cX = mx + (-dy / len) * amp, cY = my + (dx / len) * amp
          const u = 1 - e
          x = u * u * A[0] + 2 * u * e * cX + e * e * B[0]
          y = u * u * A[1] + 2 * u * e * cY + e * e * B[1]
        }
      }
      const [cx, cy] = w2c(x, y)
      const effDotr = (recipe.dotSize + (recipe.cloudDot - recipe.dotSize) * disp) * SCALE
      const r = effDotr * dot.sizeJit * (1 + recipe.shimmer * 0.6 * Math.sin(dot.spin + cycle * 12.56))
      if (r <= 0) continue
      if (goo) {
        const hr = Math.max(0.6, r * KH)
        gaCtx.beginPath()
        gaCtx.arc(cx * KH, cy * KH, hr, 0, 6.2832)
        gaCtx.fill()
      } else {
        ctx.globalAlpha = dot.alpha
        ctx.beginPath()
        ctx.arc(cx, cy, r, 0, 6.2832)
        ctx.fill()
      }
    }

    if (goo) {
      gbCtx.setTransform(1, 0, 0, 1, 0, 0)
      gbCtx.clearRect(0, 0, HALF, HALF)
      gbCtx.filter = `blur(${(needsChromiumGooTune ? recipe.goo * chromeGooMult : recipe.goo)}px)`
      gbCtx.drawImage(gaCanvas, 0, 0)
      gbCtx.filter = 'none'
      const img = gbCtx.getImageData(0, 0, HALF, HALF)
      const d = img.data
      const [AR, AG, AB] = accentRGB
      const T = needsChromiumGooTune ? chromeThreshold : 96
      for (let q = 0; q < d.length; q += 4) {
        if (d[q + 3]! > T) {
          d[q] = AR
          d[q + 1] = AG
          d[q + 2] = AB
          d[q + 3] = 255
        } else d[q + 3] = 0
      }
      gbCtx.putImageData(img, 0, 0)
      ctx.imageSmoothingEnabled = true
      ctx.globalAlpha = 1
      ctx.drawImage(gbCanvas, 0, 0, HALF, HALF, 0, 0, W, canvas.height)
    }

    // Errant specks — drawn crisp on top of the goo so they never merge in.
    ctx.fillStyle = col
    for (const e of ERRANT) {
      const ex = e.bx + Math.sin(clock * e.sx + e.px) * e.ax
      const ey = e.by + Math.cos(clock * e.sy + e.py) * e.ay
      ctx.globalAlpha = e.alpha
      ctx.beginPath()
      ctx.arc(ex, ey, e.r, 0, 6.2832)
      ctx.fill()
    }
    ctx.globalAlpha = 1
  }

  // ── loop ────────────────────────────────────────────────────────
  let raf = 0
  let last = 0
  let clock = 0 // monotonic ms — drives cycle, errant drift, and shimmer
  let running = false
  let paused = false
  const total = (recipe.hold + recipe.flow) * 4
  function tick(now: number) {
    if (!running || paused) return
    const dt = Math.max(0, now - last)
    last = now
    clock += dt
    render()
    raf = requestAnimationFrame(tick)
  }

  buildDots()
  buildErrant()

  return {
    start() {
      if (running) return
      running = true
      last = performance.now()
      raf = requestAnimationFrame(tick)
    },
    stop() {
      running = false
      if (raf) cancelAnimationFrame(raf)
      raf = 0
    },
    renderStatic() {
      clock = 0
      render()
    },
    seekPhase(p: number) {
      paused = true
      running = false
      if (raf) cancelAnimationFrame(raf)
      raf = 0
      clock = (((p % 1) + 1) % 1) * total
      render()
    },
    resumeCycle() {
      paused = false
      if (!running) {
        running = true
        last = performance.now()
        raf = requestAnimationFrame(tick)
      }
    },
    isPaused() {
      return paused
    },
    destroy() {
      running = false
      if (raf) cancelAnimationFrame(raf)
      themeObs.disconnect()
      mq.removeEventListener('change', onMq)
      svg.remove()
    },
  }
}

export const INTERLUDE_LABELS = GLYPH_LABELS
