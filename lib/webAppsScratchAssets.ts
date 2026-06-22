import { BEFORE_DRAWERS, fillLottoScratchLayer } from '@/lib/webAppsScratchDraw'
import {
  KELVIN_SCRATCH_COVER_SRC,
  SCRATCH_ZONE_ASPECT,
  SCRATCH_ZONE_VIEWBOX,
} from '@/lib/kelvin-scratch/ticket'

export const SCRATCH_QUAD_PX = 280
export const SCRATCH_QUAD_CARD_PX = SCRATCH_QUAD_PX * 2
/** Scratch zone raster size (ticket foil / reveal art). */
export const SCRATCH_CARD_PX = 560
export const SCRATCH_CARD_HEIGHT_PX = Math.round(SCRATCH_CARD_PX / SCRATCH_ZONE_ASPECT)
/** Scales with card size; sized for Kelvin coin artwork in the scratch brush. */
export const COIN_BRUSH_PX = Math.round(56 * (SCRATCH_QUAD_PX / 400))
/** Follow-cursor display (tilted coin) — slightly larger than brush stamp. */
export const COIN_CURSOR_PX = Math.round(COIN_BRUSH_PX * 1.35)

export const KELVIN_COIN_FLAT_SRC = '/images/web-apps/kelvin-coin-flat.png'
export const KELVIN_COIN_TILTED_SRC = '/images/web-apps/kelvin-coin-tilted.png'

/** Quadrant placement for the 2×2 “before” wireframes (matches BEFORE_DRAWERS order). */
export const BEFORE_QUAD_LAYOUT = [
  { col: 0, row: 0 },
  { col: 1, row: 0 },
  { col: 0, row: 1 },
  { col: 1, row: 1 },
] as const

/** Foil texture from react-native-scratch-card-example `scratch-front.webp`. */
export const SCRATCH_FRONT_SRC = '/images/web-apps/scratch-front.webp'

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.decoding = 'async'
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error(`Failed to load ${src}`))
    img.src = src
  })
}

export function loadScratchFrontImage(): Promise<HTMLImageElement> {
  return loadImage(SCRATCH_FRONT_SRC)
}

/** SVG cover loads with tiny intrinsic size (~157×150); rasterize to viewBox px. */
export function loadScratchTicketCoverImage(
  coverSrc: string = KELVIN_SCRATCH_COVER_SRC,
): Promise<HTMLImageElement> {
  const { width, height } = SCRATCH_ZONE_VIEWBOX
  return loadImage(coverSrc).then(
    (svg) =>
      new Promise<HTMLImageElement>((resolve, reject) => {
        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        if (!ctx) {
          reject(new Error('Failed to rasterize scratch cover'))
          return
        }
        ctx.drawImage(svg, 0, 0, width, height)
        const dataUrl = canvas.toDataURL('image/png')
        if (dataUrl.length < 100) {
          reject(new Error('Failed to rasterize scratch cover'))
          return
        }
        const img = new Image()
        img.decoding = 'async'
        img.onload = () => resolve(img)
        img.onerror = () =>
          reject(new Error(`Failed to load rasterized ${coverSrc}`))
        img.src = dataUrl
      }),
  )
}

/** Rasterize loaded artwork for ScratchCard cover (SVG-safe). */
export function rasterizeScratchImage(
  img: HTMLImageElement,
  width: number,
  height: number,
): string {
  const nw = img.naturalWidth || width
  const nh = img.naturalHeight || height
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) return ''
  ctx.drawImage(img, 0, 0, nw, nh, 0, 0, width, height)
  const dataUrl = canvas.toDataURL('image/png')
  return dataUrl.length > 100 ? dataUrl : ''
}

export function loadKelvinCoinImages(): Promise<{
  flat: HTMLImageElement
  tilted: HTMLImageElement
}> {
  return Promise.all([
    loadImage(KELVIN_COIN_FLAT_SRC),
    loadImage(KELVIN_COIN_TILTED_SRC),
  ]).then(([flat, tilted]) => ({ flat, tilted }))
}

/** Simple circular brush when coin artwork fails to load. */
export function createFallbackCoinBrushDataUrl(size = COIN_BRUSH_PX): string {
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')
  if (!ctx) return ''

  const r = size * 0.42
  const cx = size / 2
  const cy = size / 2
  const gradient = ctx.createRadialGradient(cx, cy, r * 0.2, cx, cy, r)
  gradient.addColorStop(0, '#f5d76e')
  gradient.addColorStop(1, '#c9a227')
  ctx.fillStyle = gradient
  ctx.beginPath()
  ctx.arc(cx, cy, r, 0, Math.PI * 2)
  ctx.fill()

  return canvas.toDataURL('image/png')
}

/** Rasterize tilted coin for ScratchCard `brush` prop. */
export function createCoinBrushDataUrl(
  coin: HTMLImageElement,
  size = COIN_BRUSH_PX,
): string {
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')
  if (!ctx) return ''

  ctx.clearRect(0, 0, size, size)
  const scale = Math.min(size / coin.width, size / coin.height)
  const w = coin.width * scale
  const h = coin.height * scale
  ctx.drawImage(coin, (size - w) / 2, (size - h) / 2, w, h)

  return canvas.toDataURL('image/png')
}

/** Unified scratch cover: foil + quadrant placeholders (SVG or canvas fallback). */
export function createUnifiedScratchCoverDataUrl(
  scratchFront: HTMLImageElement | null | undefined,
  quadPlaceholders: (HTMLImageElement | null)[],
  quadSize = SCRATCH_QUAD_PX,
): string {
  const cardSize = quadSize * 2
  const canvas = document.createElement('canvas')
  canvas.width = cardSize
  canvas.height = cardSize
  const ctx = canvas.getContext('2d')
  if (!ctx) return ''

  if (scratchFront) {
    ctx.drawImage(scratchFront, 0, 0, cardSize, cardSize)
  } else {
    fillLottoScratchLayer(ctx, cardSize, cardSize)
  }

  BEFORE_DRAWERS.forEach((draw, i) => {
    const { col, row } = BEFORE_QUAD_LAYOUT[i]
    const placeholder = quadPlaceholders[i]
    ctx.save()
    ctx.translate(col * quadSize, row * quadSize)
    if (placeholder) {
      ctx.drawImage(placeholder, 0, 0, quadSize, quadSize)
    } else {
      draw(ctx, quadSize, quadSize)
    }
    ctx.restore()
  })

  ctx.strokeStyle = 'rgba(0, 0, 0, 0.08)'
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(quadSize + 0.5, 0)
  ctx.lineTo(quadSize + 0.5, cardSize)
  ctx.moveTo(0, quadSize + 0.5)
  ctx.lineTo(cardSize, quadSize + 0.5)
  ctx.stroke()

  return canvas.toDataURL('image/png')
}

export function loadKelvinScratchQuadPlaceholders(
  sources: readonly string[],
): Promise<(HTMLImageElement | null)[]> {
  return Promise.all(
    sources.map(
      (src) =>
        new Promise<HTMLImageElement | null>((resolve) => {
          const img = new Image()
          img.decoding = 'async'
          img.onload = () => resolve(img)
          img.onerror = () => resolve(null)
          img.src = src
        }),
    ),
  )
}

/** @deprecated Per-quadrant covers — use createUnifiedScratchCoverDataUrl */
export function createQuadBeforeCoverDataUrl(
  quadIndex: number,
  scratchFront?: HTMLImageElement | null,
  quadSize = SCRATCH_QUAD_PX,
): string {
  const canvas = document.createElement('canvas')
  canvas.width = quadSize
  canvas.height = quadSize
  const ctx = canvas.getContext('2d')
  if (!ctx) return ''

  if (scratchFront) {
    const { col, row } = BEFORE_QUAD_LAYOUT[quadIndex] ?? BEFORE_QUAD_LAYOUT[0]
    ctx.drawImage(
      scratchFront,
      col * quadSize,
      row * quadSize,
      quadSize,
      quadSize,
      0,
      0,
      quadSize,
      quadSize,
    )
  } else {
    fillLottoScratchLayer(ctx, quadSize, quadSize)
  }

  const draw = BEFORE_DRAWERS[quadIndex]
  if (draw) draw(ctx, quadSize, quadSize)

  return canvas.toDataURL('image/png')
}
