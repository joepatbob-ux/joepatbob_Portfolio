import * as THREE from 'three'

export type QuoteSlipLayout = {
  id: number
  quote: string
  preview: string
  position: [number, number, number]
  rotation: [number, number, number]
  scale: number
  foldSeed: number
  crinkleSeed: number
}

const TYPEWRITER_FONT =
  '500 24px "Courier New", Courier, "Lucida Console", monospace'

function seededRandom(seed: number) {
  let state = seed % 2147483647
  if (state <= 0) state += 2147483646
  return () => {
    state = (state * 16807) % 2147483647
    return (state - 1) / 2147483646
  }
}

function hash2D(x: number, y: number, seed: number): number {
  const s = Math.sin(x * 127.1 + y * 311.7 + seed * 17.13) * 43758.5453
  return s - Math.floor(s)
}

function noise2D(x: number, y: number, seed: number): number {
  const xi = Math.floor(x)
  const yi = Math.floor(y)
  const xf = x - xi
  const yf = y - yi
  const a = hash2D(xi, yi, seed)
  const b = hash2D(xi + 1, yi, seed)
  const c = hash2D(xi, yi + 1, seed)
  const d = hash2D(xi + 1, yi + 1, seed)
  const ux = xf * xf * (3 - 2 * xf)
  const uy = yf * yf * (3 - 2 * yf)
  return THREE.MathUtils.lerp(
    THREE.MathUtils.lerp(a, b, ux),
    THREE.MathUtils.lerp(c, d, ux),
    uy,
  )
}

export function quotePreview(quote: string, maxLen = 38): string {
  if (quote.length <= maxLen) return quote
  return `${quote.slice(0, maxLen - 1).trim()}…`
}

/** Pack crumpled paper inside the bowl cavity — below the rim. */
export function buildQuoteSlipLayouts(
  answers: readonly string[],
  slipCount: number,
  bowlHeight: number,
  innerRadius: number,
  pileTopY: number,
  pileBottomY: number,
  paperRadius: number,
): QuoteSlipLayout[] {
  const rand = seededRandom(1464)
  const pool = [...answers]
  for (let i = pool.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rand() * (i + 1))
    ;[pool[i], pool[j]] = [pool[j], pool[i]]
  }

  const count = slipCount
  const layouts: QuoteSlipLayout[] = []
  const fillHeight = Math.max(pileTopY - pileBottomY, 0.01)
  const floorY = pileBottomY + paperRadius * 1.02
  const pileCeilingY = pileBottomY + fillHeight * 0.48

  for (let i = 0; i < count; i += 1) {
    const quote = pool[i % pool.length]
    const angle = rand() * Math.PI * 2

    const heightT = Math.pow(rand(), 1.05)
    const y =
      floorY +
      heightT * (pileCeilingY - floorY) +
      (rand() - 0.5) * fillHeight * 0.05
    const r =
      innerRadius *
      (0.12 + rand() * 0.46) *
      THREE.MathUtils.lerp(0.82, 1.1, heightT)

    layouts.push({
      id: i,
      quote,
      preview: quotePreview(quote),
      position: [Math.cos(angle) * r, y, Math.sin(angle) * r],
      rotation: [
        (rand() - 0.5) * Math.PI * 2,
        rand() * Math.PI * 2,
        (rand() - 0.5) * Math.PI * 2,
      ],
      scale: 0.86 + rand() * 0.24,
      foldSeed: 100 + i * 17,
      crinkleSeed: 400 + i * 23,
    })
  }

  return layouts
}

/** Guaranteed in-bowl pile for rendering and pick targets. */
export function buildInsideBowlLayouts(
  answers: readonly string[],
  slipCount: number,
  bowlHeight: number,
  innerRadius: number,
  pileTopY: number,
  pileBottomY: number,
  paperRadius: number,
): QuoteSlipLayout[] {
  return snapLayoutsInsideBowl(
    buildQuoteSlipLayouts(
      answers,
      slipCount,
      bowlHeight,
      innerRadius,
      pileTopY,
      pileBottomY,
      paperRadius,
    ),
    innerRadius,
    pileBottomY,
    pileTopY,
    paperRadius,
  )
}

function bowlRadiusAtY(
  y: number,
  innerRadius: number,
  bottomY: number,
  topY: number,
): number {
  const height = Math.max(topY - bottomY, 0.01)
  const t = THREE.MathUtils.clamp((y - bottomY) / height, 0, 1)
  const rimR = innerRadius * 0.94
  const bellyR = innerRadius * 1.04
  const bottomR = innerRadius * 0.36

  if (t < 0.14) return THREE.MathUtils.lerp(bottomR, bellyR * 0.7, t / 0.14)
  if (t < 0.52) return THREE.MathUtils.lerp(bellyR * 0.7, bellyR, (t - 0.14) / 0.38)
  return THREE.MathUtils.lerp(bellyR, rimR, (t - 0.52) / 0.48)
}

/** Keep settled in-bowl slips inside the visible glass cavity. */
export function snapLayoutsInsideBowl(
  layouts: readonly QuoteSlipLayout[],
  innerRadius: number,
  bottomY: number,
  topY: number,
  paperRadius: number,
): QuoteSlipLayout[] {
  return layouts.map((layout) => {
    const [x, y, z] = layout.position
    const fillHeight = topY - bottomY
    const minY = bottomY + paperRadius * 0.98
    const pileTop = bottomY + fillHeight * 0.52
    const clampedY = THREE.MathUtils.clamp(y, minY, pileTop)
    const maxR = bowlRadiusAtY(clampedY, innerRadius, bottomY, topY) * 0.58
    const xz = Math.hypot(x, z)

    if (xz <= maxR) {
      return { ...layout, position: [x, clampedY, z] }
    }

    const scale = maxR / xz
    return {
      ...layout,
      position: [x * scale, clampedY, z * scale],
    }
  })
}

/** Topmost folded slip — pulled when the bowl is clicked. */
export function pickSlipFromBowl(slips: readonly QuoteSlipLayout[]): QuoteSlipLayout {
  if (slips.length === 0) {
    return {
      id: 0,
      quote: 'Ask again.',
      preview: 'Ask again.',
      position: [0, 0, 0],
      rotation: [0, 0, 0],
      scale: 1,
      foldSeed: 1,
      crinkleSeed: 1,
    }
  }
  const topN = [...slips]
    .sort((a, b) => b.position[1] - a.position[1])
    .slice(0, Math.max(3, Math.floor(slips.length * 0.12)))
  const idx = Math.floor(Math.random() * topN.length)
  return topN[idx] ?? slips[0]
}

function paintCrinkle(ctx: CanvasRenderingContext2D, w: number, h: number, seed: number) {
  ctx.save()
  ctx.globalAlpha = 0.07
  ctx.strokeStyle = '#2a2a2a'
  ctx.lineWidth = 1
  const rand = seededRandom(seed)
  for (let i = 0; i < 28; i += 1) {
    const x0 = rand() * w
    const y0 = rand() * h
    ctx.beginPath()
    ctx.moveTo(x0, y0)
    for (let j = 0; j < 4; j += 1) {
      ctx.lineTo(x0 + (rand() - 0.5) * 80, y0 + (rand() - 0.5) * 40)
    }
    ctx.stroke()
  }
  ctx.restore()

  const image = ctx.getImageData(0, 0, w, h)
  const data = image.data
  for (let y = 0; y < h; y += 2) {
    for (let x = 0; x < w; x += 2) {
      const n = noise2D(x * 0.04, y * 0.04, seed)
      const shade = Math.floor((n - 0.5) * 18)
      const idx = (y * w + x) * 4
      data[idx] = THREE.MathUtils.clamp(data[idx] + shade, 0, 255)
      data[idx + 1] = THREE.MathUtils.clamp(data[idx + 1] + shade, 0, 255)
      data[idx + 2] = THREE.MathUtils.clamp(data[idx + 2] + shade, 0, 255)
    }
  }
  ctx.putImageData(image, 0, 0)
}

function paintNotebookBase(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.fillStyle = '#faf6eb'
  ctx.fillRect(0, 0, w, h)

  const marginX = w * 0.09
  ctx.fillStyle = 'rgba(229, 115, 115, 0.55)'
  ctx.fillRect(marginX, 0, w * 0.008, h)

  ctx.strokeStyle = 'rgba(42, 42, 42, 0.1)'
  ctx.lineWidth = 1
  const lineStep = h / 6
  for (let y = lineStep; y < h; y += lineStep) {
    ctx.beginPath()
    ctx.moveTo(0, y + 0.5)
    ctx.lineTo(w, y + 0.5)
    ctx.stroke()
  }
}

/** Notebook paper with crinkle shading + typewriter snippet. */
export function paintQuoteSlipTexture(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  text: string,
  seed: number,
  showText: boolean,
  textProgress = 1,
) {
  paintNotebookBase(ctx, width, height)
  paintCrinkle(ctx, width, height, seed)

  ctx.strokeStyle = 'rgba(42, 42, 42, 0.16)'
  ctx.lineWidth = 1.25
  ctx.strokeRect(0.5, 0.5, width - 1, height - 1)

  if (showText && textProgress > 0) {
    ctx.fillStyle = '#1f1f1f'
    const fontSize = Math.max(18, Math.round(height * 0.109))
    ctx.font = `500 ${fontSize}px "Courier New", Courier, "Lucida Console", monospace`
    ctx.textBaseline = 'middle'
    const copy = text.startsWith('"') ? text : `"${text}"`
    const chars = Math.max(0, Math.floor(copy.length * THREE.MathUtils.clamp(textProgress, 0, 1)))
    if (chars > 0) {
      ctx.fillText(copy.slice(0, chars), width * 0.14, height * 0.52, width * 0.78)
    }
  }
}

export function createQuoteSlipTexture(
  text: string,
  seed: number,
  showText = true,
  textProgress = 1,
): THREE.CanvasTexture {
  const width = 720
  const height = showText ? 220 : 180
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    return new THREE.CanvasTexture(canvas)
  }

  paintQuoteSlipTexture(ctx, width, height, text, seed, showText, textProgress)

  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.anisotropy = 4
  return texture
}

/** Subdivided plane with vertex crinkle — amplitude lerps during unfold. */
export function createCrinkledSlipGeometry(
  width: number,
  height: number,
  seed: number,
  segmentsX = 28,
  segmentsY = 10,
): THREE.PlaneGeometry {
  const geo = new THREE.PlaneGeometry(width, height, segmentsX, segmentsY)
  const pos = geo.attributes.position as THREE.BufferAttribute
  const crinkle = new Float32Array(pos.count)
  for (let i = 0; i < pos.count; i += 1) {
    const x = pos.getX(i)
    const y = pos.getY(i)
    const n =
      noise2D(x * 7.5 + seed, y * 8.5, seed) * 0.65 +
      noise2D(x * 14 + seed, y * 16, seed + 7) * 0.35
    const amp = 0.022
    crinkle[i] = (n - 0.5) * amp
    pos.setZ(i, crinkle[i])
  }
  geo.setAttribute('crinkle', new THREE.BufferAttribute(crinkle, 1))
  geo.computeVertexNormals()
  return geo
}

export function setCrinkleAmplitude(
  geometry: THREE.PlaneGeometry,
  amplitude: number,
) {
  const pos = geometry.attributes.position as THREE.BufferAttribute
  const base = geometry.attributes.crinkle as THREE.BufferAttribute
  if (!base) return
  for (let i = 0; i < pos.count; i += 1) {
    pos.setZ(i, base.getX(i) * amplitude)
  }
  pos.needsUpdate = true
  geometry.computeVertexNormals()
}

/** Two-panel folded note for the pile inside the bowl. */
export function createFoldedPaperGeometries(
  seed: number,
): [THREE.PlaneGeometry, THREE.PlaneGeometry] {
  const w = 0.072
  const h = 0.054
  const leafA = createCrinkledSlipGeometry(w, h, seed, 8, 6)
  const leafB = createCrinkledSlipGeometry(w, h, seed + 11, 8, 6)
  return [leafA, leafB]
}

export type SlipUnfoldKeyframe = {
  position: THREE.Vector3
  rotation: THREE.Euler
  foldAngle: number
  crinkleAmp: number
  scaleX: number
  scaleY: number
  scaleZ: number
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

function phaseT(t: number, start: number, end: number): number {
  if (t <= start) return 0
  if (t >= end) return 1
  return easeOutCubic((t - start) / (end - start))
}

/** Gather at rim, rise from top, unfold, flatten crinkle. */
export function sampleSlipUnfold(
  t: number,
  home: THREE.Vector3,
  homeRot: THREE.Euler,
  bowlTopY: number,
): SlipUnfoldKeyframe {
  const gather = phaseT(t, 0, 0.22)
  const rise = phaseT(t, 0.18, 0.52)
  const unfold = phaseT(t, 0.38, 0.82)
  const flatten = phaseT(t, 0.62, 1)

  const rim = new THREE.Vector3(
    THREE.MathUtils.lerp(home.x, 0, gather),
    bowlTopY - 0.04,
    THREE.MathUtils.lerp(home.z, 0, gather),
  )
  const above = new THREE.Vector3(0, bowlTopY + 1.05, 0.78)

  const position = new THREE.Vector3()
  if (t < 0.22) {
    position.lerpVectors(home, rim, gather)
  } else {
    position.lerpVectors(rim, above, rise)
  }

  const rotation = new THREE.Euler(
    THREE.MathUtils.lerp(homeRot.x, -0.18, unfold),
    THREE.MathUtils.lerp(homeRot.y, 0, unfold),
    THREE.MathUtils.lerp(homeRot.z, 0, unfold),
  )

  return {
    position,
    rotation,
    foldAngle: THREE.MathUtils.lerp(1.05, 0, unfold),
    crinkleAmp: THREE.MathUtils.lerp(1, 0.16, flatten),
    scaleX: THREE.MathUtils.lerp(0.38, 1.14, unfold),
    scaleY: THREE.MathUtils.lerp(0.48, 1, unfold),
    scaleZ: THREE.MathUtils.lerp(0.38, 1, unfold),
  }
}

export function slipPullProgress(elapsedMs: number, durationMs: number): number {
  const t = Math.min(elapsedMs / durationMs, 1)
  return easeOutCubic(t)
}

export const PULL_MS = 1180

export const BOWL_CAMERA = {
  position: [0, 0.42, 5.15] as const,
  lookAt: [0, 0.08, 0] as const,
  fov: 42,
}
