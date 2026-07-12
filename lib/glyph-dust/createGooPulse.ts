// Ambient goo pulse — a loose, breathing cluster of accent motes that churns
// around a center, rendered with the same sticky metaball pass as the interlude
// dust (native canvas blur + alpha threshold). Used as the phone-stage loader.

export interface GooPulseRecipe {
  /** motes in the breathing cluster */
  motes: number
  /** base cluster radius as a fraction of half the canvas */
  radius: number
  /** droplet radius (px, pre-goo) */
  dotSize: number
  /** metaball blur px at half-res (stickiness) */
  goo: number
  /** breathing amplitude (0–1 of base radius) */
  breath: number
  /** breathing period (ms) */
  breathMs: number
  /** base angular speed (rad/s) at the rim */
  spin: number
  /** count of free-floating specks that never merge */
  errant: number
}

interface Mote {
  r: number // base radius (0–1 of cluster radius)
  a: number // base angle
  spd: number // angular speed multiplier
  wobA: number // radial wobble amplitude
  wobP: number // radial wobble phase
  size: number // size jitter
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

export interface GooPulseHandle {
  start(): void
  stop(): void
  renderStatic(): void
  destroy(): void
}

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

export function createGooPulse(
  canvas: HTMLCanvasElement,
  recipe: GooPulseRecipe,
): GooPulseHandle {
  const ctx = canvas.getContext('2d')!
  const W = canvas.width
  const H = canvas.height
  const cx = W / 2
  const cy = H / 2
  const R = Math.min(W, H) * 0.5 * recipe.radius
  const HALF = Math.max(1, Math.round(Math.min(W, H) * 0.5))
  const KH = HALF / W

  // ── breathing cluster ───────────────────────────────────────────
  const rnd = mulberry32(4242)
  const MOTES: Mote[] = new Array(Math.max(0, Math.round(recipe.motes)))
  for (let i = 0; i < MOTES.length; i++) {
    // bias slightly inward for a solid core with a softer, churning rim
    const r = Math.pow(rnd(), 0.65)
    MOTES[i] = {
      r,
      a: rnd() * Math.PI * 2,
      // differential rotation: inner motes turn faster → organic shearing swirl
      spd: (0.5 + (1 - r) * 1.1) * (rnd() < 0.5 ? 1 : 0.85),
      wobA: 0.05 + rnd() * 0.13,
      wobP: rnd() * Math.PI * 2,
      size: 0.7 + rnd() * 0.7,
    }
  }

  // ── errant specks ───────────────────────────────────────────────
  let ERRANT: Errant[] = []
  {
    const er = mulberry32(9001)
    const n = Math.max(0, Math.round(recipe.errant))
    ERRANT = new Array(n)
    for (let k = 0; k < n; k++) {
      ERRANT[k] = {
        bx: er() * W,
        by: er() * H,
        ax: (0.1 + er() * 0.26) * W,
        ay: (0.1 + er() * 0.26) * H,
        sx: (0.00016 + er() * 0.00042) * (er() < 0.5 ? -1 : 1),
        sy: (0.00016 + er() * 0.00042) * (er() < 0.5 ? -1 : 1),
        px: er() * Math.PI * 2,
        py: er() * Math.PI * 2,
        r: (0.045 + er() * 0.09) * Math.min(W, H) * 0.25,
        alpha: 0.32 + er() * 0.5,
      }
    }
  }

  // ── accent (cached, updated on theme change) ────────────────────
  let accentHex = '#DE3E18'
  let accentRGB: [number, number, number] = [222, 62, 24]
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

  // ── half-res goo buffers ────────────────────────────────────────
  const gaCanvas = document.createElement('canvas')
  gaCanvas.width = HALF
  gaCanvas.height = HALF
  const gaCtx = gaCanvas.getContext('2d', { willReadFrequently: true })!
  const gbCanvas = document.createElement('canvas')
  gbCanvas.width = HALF
  gbCanvas.height = HALF
  const gbCtx = gbCanvas.getContext('2d', { willReadFrequently: true })!

  const goo = recipe.goo >= 1
  const dotr = recipe.dotSize

  function render(t: number) {
    ctx.setTransform(1, 0, 0, 1, 0, 0)
    ctx.clearRect(0, 0, W, H)
    const breathe = 1 + recipe.breath * Math.sin((t / recipe.breathMs) * Math.PI * 2)
    const secs = t / 1000

    if (goo) {
      gaCtx.setTransform(1, 0, 0, 1, 0, 0)
      gaCtx.clearRect(0, 0, HALF, HALF)
      gaCtx.globalAlpha = 1
      gaCtx.fillStyle = accentHex
    } else {
      ctx.fillStyle = accentHex
    }

    for (const m of MOTES) {
      const ang = m.a + recipe.spin * m.spd * secs
      const wob = 1 + m.wobA * Math.sin(secs * 1.9 + m.wobP)
      const rr = m.r * R * breathe * wob
      const x = cx + Math.cos(ang) * rr
      const y = cy + Math.sin(ang) * rr
      const r = dotr * m.size
      if (goo) {
        gaCtx.beginPath()
        gaCtx.arc(x * KH, y * KH, Math.max(0.6, r * KH), 0, 6.2832)
        gaCtx.fill()
      } else {
        ctx.globalAlpha = 0.85
        ctx.beginPath()
        ctx.arc(x, y, r, 0, 6.2832)
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
        if (d[q + 3]! > T) {
          d[q] = AR
          d[q + 1] = AG
          d[q + 2] = AB
          d[q + 3] = 255
        } else {
          d[q + 3] = 0
        }
      }
      gbCtx.setTransform(1, 0, 0, 1, 0, 0)
      gbCtx.clearRect(0, 0, HALF, HALF)
      gbCtx.putImageData(img, 0, 0)
      ctx.imageSmoothingEnabled = true
      ctx.globalAlpha = 1
      ctx.drawImage(gbCanvas, 0, 0, HALF, HALF, 0, 0, W, H)
    }

    // Errant specks — crisp on top so they never merge into the goo.
    ctx.fillStyle = accentHex
    for (const e of ERRANT) {
      const ex = e.bx + Math.sin(t * e.sx + e.px) * e.ax
      const ey = e.by + Math.cos(t * e.sy + e.py) * e.ay
      ctx.globalAlpha = e.alpha
      ctx.beginPath()
      ctx.arc(ex, ey, e.r, 0, 6.2832)
      ctx.fill()
    }
    ctx.globalAlpha = 1
  }

  // ── loop ────────────────────────────────────────────────────────
  let raf = 0
  let clock = 0
  let last = 0
  let running = false
  function tick(now: number) {
    if (!running) return
    clock += Math.max(0, now - last)
    last = now
    render(clock)
    raf = requestAnimationFrame(tick)
  }

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
      render(recipe.breathMs * 0.25) // a settled, fully-breathed frame
    },
    destroy() {
      running = false
      if (raf) cancelAnimationFrame(raf)
      themeObs.disconnect()
      mq.removeEventListener('change', onMq)
    },
  }
}
