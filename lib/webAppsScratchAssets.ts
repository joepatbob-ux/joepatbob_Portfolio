import { BEFORE_DRAWERS, fillLottoScratchLayer } from '@/lib/webAppsScratchDraw'

export const SCRATCH_QUAD_PX = 280
export const SCRATCH_CARD_PX = SCRATCH_QUAD_PX * 2
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
export const SCRATCH_FRONT_SRC = '/images/web-apps-scratch-front.webp'

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

export function loadKelvinCoinImages(): Promise<{
  flat: HTMLImageElement
  tilted: HTMLImageElement
}> {
  return Promise.all([
    loadImage(KELVIN_COIN_FLAT_SRC),
    loadImage(KELVIN_COIN_TILTED_SRC),
  ]).then(([flat, tilted]) => ({ flat, tilted }))
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

/** Single-quadrant scratch cover: foil + one legacy wireframe. */
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
