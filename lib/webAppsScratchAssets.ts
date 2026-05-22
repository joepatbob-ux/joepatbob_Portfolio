import { BEFORE_DRAWERS, fillLottoScratchLayer } from '@/lib/webAppsScratchDraw'

export const SCRATCH_QUAD_PX = 400
export const SCRATCH_CARD_PX = SCRATCH_QUAD_PX * 2
/** Matches RN Skia example strokeWidth (50). */
export const COIN_BRUSH_PX = 50

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

/** Scratch-off cover: foil texture + per-product “before” wireframe (one per quadrant). */
export function createBeforeCoverDataUrls(
  scratchFront?: HTMLImageElement | null,
  size = SCRATCH_QUAD_PX,
): string[] {
  return BEFORE_DRAWERS.map((draw) => {
    const canvas = document.createElement('canvas')
    canvas.width = size
    canvas.height = size
    const ctx = canvas.getContext('2d')
    if (!ctx) return ''

    if (scratchFront) {
      ctx.drawImage(scratchFront, 0, 0, size, size)
    } else {
      fillLottoScratchLayer(ctx, size, size)
    }
    draw(ctx, size, size)
    return canvas.toDataURL('image/png')
  })
}
