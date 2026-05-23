import { BEFORE_DRAWERS, fillLottoScratchLayer } from '@/lib/webAppsScratchDraw'

export const SCRATCH_QUAD_PX = 280
export const SCRATCH_CARD_PX = SCRATCH_QUAD_PX * 2
/** Scales with card size (50px brush at 400px quadrant). */
export const COIN_BRUSH_PX = Math.round(50 * (SCRATCH_QUAD_PX / 400))

/** Quadrant placement for the 2×2 “before” wireframes (matches BEFORE_DRAWERS order). */
const BEFORE_QUAD_LAYOUT = [
  { col: 0, row: 0 },
  { col: 1, row: 0 },
  { col: 0, row: 1 },
  { col: 1, row: 1 },
] as const

/** Foil texture from react-native-scratch-card-example `scratch-front.webp`. */
export const SCRATCH_FRONT_SRC = '/images/web-apps-scratch-front.webp'

export function loadScratchFrontImage(): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.decoding = 'async'
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error(`Failed to load ${SCRATCH_FRONT_SRC}`))
    img.src = SCRATCH_FRONT_SRC
  })
}

/** 48px coin image for ScratchCard `brush` prop. */
export function createCoinBrushDataUrl(size = COIN_BRUSH_PX): string {
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')
  if (!ctx) return ''

  const cx = size / 2
  const cy = size / 2
  const r = size / 2 - 1

  const face = ctx.createRadialGradient(cx - 9, cy - 10, 2, cx, cy, r)
  face.addColorStop(0, '#FF8C6B')
  face.addColorStop(0.42, '#F5431B')
  face.addColorStop(1, '#C03010')
  ctx.fillStyle = face
  ctx.beginPath()
  ctx.arc(cx, cy, r, 0, Math.PI * 2)
  ctx.fill()

  ctx.strokeStyle = 'rgba(255, 255, 255, 0.55)'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.arc(cx, cy, r - 3, 0, Math.PI * 2)
  ctx.stroke()

  ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)'
  ctx.lineWidth = 1.5
  ctx.beginPath()
  ctx.arc(cx, cy, r - 7, 0.15 * Math.PI, 1.05 * Math.PI)
  ctx.stroke()

  ctx.strokeStyle = 'rgba(192, 48, 16, 0.45)'
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.arc(cx, cy, r - 1, 0.55 * Math.PI, 1.45 * Math.PI)
  ctx.stroke()

  return canvas.toDataURL('image/png')
}

/** Single scratch cover: foil + all four “before” wireframes on one 2×2 card. */
export function createUnifiedBeforeCoverDataUrl(
  scratchFront?: HTMLImageElement | null,
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
    ctx.save()
    ctx.translate(col * quadSize, row * quadSize)
    draw(ctx, quadSize, quadSize)
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
