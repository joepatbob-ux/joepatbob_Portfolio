// Gooey particle engine for the interlude: one conserved cloud of motes that
// settles into four dense dot-glyphs, disperses into a loose cloud between, and
// merges as sticky fluid (metaball blur + alpha threshold). Ported from the
// tuning prototype; all magic numbers come in through GlyphDustRecipe.

import { GLYPH_DEFS, GLYPH_LABELS, GLYPH_ORDER, type GlyphDef } from '@/lib/glyph-dust/glyphData'

export interface GlyphDustRecipe {
  /** dots per unit² in a settled glyph (sizes the shared pool off the largest form) */
  shapeDens: number
  /** dot radius (world units) when packed into a shape */
  dotSize: number
  /** dot radius (world units) at the peak of the loose cloud */
  cloudDot: number
  /** ms held as each dense glyph */
  hold: number
  /** ms of the disperse→recondense flow between glyphs */
  flow: number
  /** dots per unit² in the dispersed cloud (lower = larger, airier cloud) */
  cloudDens: number
  /** 0–1 spread of per-mote departure times */
  stagger: number
  /** 0–1 mid-flight size flicker */
  shimmer: number
  /** metaball blur px at half-res (0 = crisp round droplets, higher = stickier fluid) */
  goo: number
  /** hard cap on the mote pool (perf guard) */
  maxMotes?: number
}

interface Mote {
  pos: [number, number][] // one [x,y] per glyph
  delay: number
  cx: number // unit-disc cloud offset
  cy: number
  sizeJit: number
  alpha: number
  spin: number
}

export interface GlyphDustHandle {
  start(): void
  stop(): void
  /** paint a single settled frame (reduced-motion / static fallback) */
  renderStatic(): void
  destroy(): void
}

const VIEW = 28
const easeIO = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)

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
function bboxArea(pts: [number, number][]) {
  let a = 1e9, b = 1e9, c = -1e9, d = -1e9
  for (const [x, y] of pts) {
    a = Math.min(a, x)
    b = Math.min(b, y)
    c = Math.max(c, x)
    d = Math.max(d, y)
  }
  return (c - a) * (d - b)
}
function scanKey(p: [number, number]) {
  const band = Math.floor(p[1] * 1.4)
  const x = band % 2 === 0 ? p[0] : 24 - p[0]
  return band * 100 + x
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

  // detached SVG for path sampling
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
  svg.setAttribute('style', 'position:absolute;width:0;height:0;overflow:hidden')
  document.body.appendChild(svg)
  function samplePath(d: string, n: number, dx = 0, dy = 0): [number, number][] {
    const el = document.createElementNS('http://www.w3.org/2000/svg', 'path')
    el.setAttribute('d', d)
    svg.appendChild(el)
    const len = el.getTotalLength()
    const pts: [number, number][] = []
    for (let i = 0; i < n; i++) {
      const p = el.getPointAtLength((len * i) / n)
      pts.push([p.x + dx, p.y + dy])
    }
    el.remove()
    return pts
  }

  function prep(def: GlyphDef): Path2D {
    const [, , w, h] = def.viewBox.split(' ').map(Number)
    const dx = (24 - w) / 2, dy = (24 - h) / 2
    const paths = def.shapes.map((s) =>
      s.type === 'circle' ? circleToPath(s.cx!, s.cy!, s.r!) : s.d!,
    )
    let fi = -1, fa = -1
    paths.forEach((d, i) => {
      const s = subpaths(d)
      if (s.length >= 2) {
        const a = bboxArea(samplePath(s[0], 48, dx, dy))
        if (a > fa) {
          fa = a
          fi = i
        }
      }
    })
    const subs = subpaths(paths[fi])
    const rings = subs.map((s) => samplePath(s, 220, dx, dy))
    rings.sort((a, b) => bboxArea(b) - bboxArea(a))
    const holes = paths.filter((_, i) => i !== fi).map((d) => samplePath(d, 140, dx, dy))
    const p2d = new Path2D()
    const add = (pts: [number, number][]) => {
      p2d.moveTo(pts[0][0], pts[0][1])
      for (let i = 1; i < pts.length; i++) p2d.lineTo(pts[i][0], pts[i][1])
      p2d.closePath()
    }
    add(rings[0])
    holes.forEach(add)
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
    const ai = A.map((_, i) => i).sort((p, q) => scanKey(A[p]) - scanKey(A[q]))
    const bi = B.map((_, i) => i).sort((p, q) => scanKey(B[p]) - scanKey(B[q]))
    const out = new Array<number>(A.length)
    for (let r = 0; r < A.length; r++) out[ai[r]] = bi[r]
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
    for (const p of P) {
      const base = p.length
      if (!base || base >= N) continue
      const rnd = mulberry32(555 + base)
      const reps = Math.floor((N - base) / base)
      for (let k = 0; k < base && p.length < N; k++) {
        const src = p[k]
        for (let d = 0; d < reps; d++)
          p.push([src[0] + (rnd() - 0.5) * spacing, src[1] + (rnd() - 0.5) * spacing])
      }
      while (p.length < N) {
        const src = p[(rnd() * base) | 0]
        p.push([src[0] + (rnd() - 0.5) * spacing, src[1] + (rnd() - 0.5) * spacing])
      }
    }
    const m01 = pairMap(P[0], P[1]), m12 = pairMap(P[1], P[2]), m23 = pairMap(P[2], P[3])
    const rnd = mulberry32(777)
    DOTS = new Array(N)
    for (let k = 0; k < N; k++) {
      const a = P[0][k], b = P[1][m01[k]], c = P[2][m12[m01[k]]], d = P[3][m23[m12[m01[k]]]]
      const cr = Math.sqrt(rnd()), cth = rnd() * Math.PI * 2
      DOTS[k] = {
        pos: [a, b, c, d],
        delay: rnd(),
        cx: cr * Math.cos(cth),
        cy: cr * Math.sin(cth),
        sizeJit: 0.65 + rnd() * 0.7,
        alpha: 0.72 + rnd() * 0.28,
        spin: rnd() * Math.PI * 2,
      }
    }
  }

  // ── accent (cached, updated on theme change) ────────────────────
  let accentHex = '#DE3E18'
  let accentRGB: [number, number, number] = [222, 62, 24]
  function refreshAccent() {
    const v = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim()
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

  function render(p: number) {
    ctx.setTransform(1, 0, 0, 1, 0, 0)
    ctx.clearRect(0, 0, W, canvas.height)
    const col = accentHex
    const legLen = recipe.hold + recipe.flow, holdFrac = recipe.hold / legLen
    const x4 = ((((p % 1) + 1) % 1) * 4)
    const i = Math.max(0, Math.min(3, Math.floor(x4)))
    const f = x4 - i
    const j = (i + 1) % 4
    let flowing = false, ft = 0
    if (f >= holdFrac) {
      flowing = true
      ft = (f - holdFrac) / (1 - holdFrac)
    }
    const span = Math.max(0.25, 1 - recipe.stagger)
    const gooMargin = recipe.goo >= 1 ? recipe.goo / KH / SCALE : 0
    const maxR = 12 - 0.6 - gooMargin - recipe.cloudDot
    const R = Math.min(maxR, Math.sqrt(N / (Math.PI * Math.max(0.3, recipe.cloudDens))))
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
        const A = dot.pos[i], B = dot.pos[j]
        const lt = Math.max(0, Math.min(1, (ft - dot.delay * recipe.stagger) / span))
        disp = Math.sin(Math.PI * lt)
        const C0 = 12 + R * dot.cx, C1 = 12 + R * dot.cy
        if (lt < 0.5) {
          const s = easeIO(lt / 0.5)
          x = A[0] + (C0 - A[0]) * s
          y = A[1] + (C1 - A[1]) * s
        } else {
          const s = easeIO((lt - 0.5) / 0.5)
          x = C0 + (B[0] - C0) * s
          y = C1 + (B[1] - C1) * s
        }
      }
      const [cx, cy] = w2c(x, y)
      const effDotr = (recipe.dotSize + (recipe.cloudDot - recipe.dotSize) * disp) * SCALE
      const r = effDotr * dot.sizeJit * (1 + recipe.shimmer * 0.6 * Math.sin(dot.spin + p * 12.56))
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
      gbCtx.filter = `blur(${recipe.goo}px)`
      gbCtx.drawImage(gaCanvas, 0, 0)
      gbCtx.filter = 'none'
      const img = gbCtx.getImageData(0, 0, HALF, HALF)
      const d = img.data
      const [AR, AG, AB] = accentRGB
      const T = 96
      for (let q = 0; q < d.length; q += 4) {
        if (d[q + 3] > T) {
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
    ctx.globalAlpha = 1
  }

  // ── loop ────────────────────────────────────────────────────────
  let raf = 0
  let last = 0
  let phase = 0
  let running = false
  const total = (recipe.hold + recipe.flow) * 4
  function tick(now: number) {
    if (!running) return
    const dt = Math.max(0, now - last)
    last = now
    phase = (((phase + dt / total) % 1) + 1) % 1
    render(phase)
    raf = requestAnimationFrame(tick)
  }

  buildDots()

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
      render(0)
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
