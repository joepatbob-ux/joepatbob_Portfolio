/** Layout from visible (opaque) pixels — centers art in the rotate ring. */
export interface StickerOpticalLayout {
  /** Nudge so optical center aligns with ring center (display px). */
  offsetX: number
  offsetY: number
  /** Max distance from optical center to opaque edge (display px). */
  outerRadius: number
}

/**
 * Measure opaque artwork bounds so the circular track sits a uniform
 * radial distance from the sticker's furthest visible edges.
 */
export function measureStickerOpticalLayout(
  img: HTMLImageElement,
  displayW: number,
  displayH: number,
  alphaThreshold = 20,
  sampleMax = 160,
): StickerOpticalLayout | null {
  const nw = img.naturalWidth
  const nh = img.naturalHeight
  if (!nw || !nh || displayW <= 0 || displayH <= 0) return null

  const canvas = document.createElement('canvas')
  const scale = Math.min(1, sampleMax / Math.max(nw, nh))
  const sw = Math.max(1, Math.round(nw * scale))
  const sh = Math.max(1, Math.round(nh * scale))
  canvas.width = sw
  canvas.height = sh

  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  if (!ctx) return null

  try {
    ctx.drawImage(img, 0, 0, sw, sh)
  } catch {
    return null
  }

  const data = ctx.getImageData(0, 0, sw, sh).data
  const stride = 2
  const sx = displayW / sw
  const sy = displayH / sh

  let minX = sw
  let minY = sh
  let maxX = -1
  let maxY = -1
  let sumX = 0
  let sumY = 0
  let count = 0

  for (let y = 0; y < sh; y += stride) {
    for (let x = 0; x < sw; x += stride) {
      if (data[(y * sw + x) * 4 + 3] < alphaThreshold) continue
      minX = Math.min(minX, x)
      maxX = Math.max(maxX, x)
      minY = Math.min(minY, y)
      maxY = Math.max(maxY, y)
      sumX += x
      sumY += y
      count++
    }
  }

  if (count === 0) return null

  const cx = (sumX / count) * sx
  const cy = (sumY / count) * sy

  let outerRadius = 0
  const consider = (px: number, py: number) => {
    outerRadius = Math.max(outerRadius, Math.hypot(px - cx, py - cy))
  }

  for (let y = 0; y < sh; y += stride) {
    for (let x = 0; x < sw; x += stride) {
      if (data[(y * sw + x) * 4 + 3] < alphaThreshold) continue
      consider(x * sx, y * sy)
    }
  }

  consider(minX * sx, minY * sy)
  consider(maxX * sx, minY * sy)
  consider(minX * sx, maxY * sy)
  consider(maxX * sx, maxY * sy)

  return {
    offsetX: displayW / 2 - cx,
    offsetY: displayH / 2 - cy,
    outerRadius,
  }
}
