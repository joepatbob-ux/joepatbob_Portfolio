export type GlyphCell = {
  x: number
  y: number
  weight: number
}

export type ContainRect = {
  x: number
  y: number
  w: number
  h: number
}

export const GLYPH_GAP = 2
export const HOVER_RADIUS = 80

export function containRect(
  containerW: number,
  containerH: number,
  contentW: number,
  contentH: number,
): ContainRect {
  if (contentW <= 0 || contentH <= 0) {
    return { x: 0, y: 0, w: containerW, h: containerH }
  }

  const scale = Math.min(containerW / contentW, containerH / contentH)
  const w = contentW * scale
  const h = contentH * scale

  return {
    x: (containerW - w) / 2,
    y: (containerH - h) / 2,
    w,
    h,
  }
}

function sampleLuminance(
  data: Uint8ClampedArray,
  width: number,
  height: number,
  x: number,
  y: number,
  w: number,
  h: number,
): number {
  let sum = 0
  let count = 0
  const xEnd = Math.min(x + w, width)
  const yEnd = Math.min(y + h, height)

  for (let py = y; py < yEnd; py += 1) {
    for (let px = x; px < xEnd; px += 1) {
      const i = (py * width + px) * 4
      const alpha = (data[i + 3] ?? 255) / 255
      if (alpha < 0.04) continue
      sum +=
        (data[i] ?? 0) * alpha +
        (data[i + 1] ?? 0) * alpha +
        (data[i + 2] ?? 0) * alpha
      count += 1
    }
  }

  return count === 0 ? 0 : sum / count
}

function luminanceToWeight(luminance: number): number {
  const t = Math.min(1, Math.max(0, (luminance - 6) / 145))
  return 0.08 + Math.pow(t, 1.6) * 0.92
}

export function buildGlyphGrid(
  data: Uint8ClampedArray,
  width: number,
  height: number,
  gap: number,
): GlyphCell[] {
  const cells: GlyphCell[] = []

  for (let y = 0; y < height; y += gap) {
    const h = Math.min(gap, height - y)
    for (let x = 0; x < width; x += gap) {
      const w = Math.min(gap, width - x)
      const luminance = sampleLuminance(data, width, height, x, y, w, h)
      if (luminance < 6) continue

      cells.push({
        x: x + w / 2,
        y: y + h / 2,
        weight: luminanceToWeight(luminance),
      })
    }
  }

  return cells
}

export function easeOutCubic(t: number): number {
  const x = Math.max(0, Math.min(1, t))
  return 1 - (1 - x) ** 3
}

function hoverStrength(
  mouse: { x: number; y: number },
  cell: GlyphCell,
  radius: number,
): number {
  const dx = mouse.x - cell.x
  const dy = mouse.y - cell.y
  const dist = Math.sqrt(dx * dx + dy * dy)
  if (dist >= radius) return 0
  return easeOutCubic(1 - dist / radius)
}

export function drawBoardFrame(options: {
  ctx: CanvasRenderingContext2D
  image: CanvasImageSource
  imageFit: ContainRect
  cells: readonly GlyphCell[]
  mouse: { x: number; y: number }
  hover: boolean
  glyphColor: string
  fontFamily: string
}) {
  const { ctx, image, imageFit, cells, mouse, hover, glyphColor, fontFamily } = options
  const { width: displayW, height: displayH } = ctx.canvas.getBoundingClientRect()

  if (displayW < 1 || displayH < 1) return

  ctx.clearRect(0, 0, displayW, displayH)

  ctx.save()
  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(image, imageFit.x, imageFit.y, imageFit.w, imageFit.h)
  ctx.restore()

  if (!hover) return

  const fontSize = Math.max(3, GLYPH_GAP + 1)
  const holeRadius = fontSize * 0.55
  const hovered: { cell: GlyphCell; strength: number }[] = []

  for (const cell of cells) {
    const strength = hoverStrength(mouse, cell, HOVER_RADIUS)
    if (strength > 0.03) hovered.push({ cell, strength })
  }

  if (hovered.length === 0) return

  ctx.save()
  ctx.globalCompositeOperation = 'destination-out'
  for (const { cell, strength } of hovered) {
    ctx.globalAlpha = strength * cell.weight
    ctx.beginPath()
    ctx.arc(cell.x, cell.y, holeRadius, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.restore()

  ctx.font = `500 ${fontSize}px ${fontFamily}`
  ctx.fillStyle = glyphColor
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'

  for (const { cell, strength } of hovered) {
    const alpha = strength * cell.weight
    if (alpha <= 0.02) continue
    ctx.save()
    ctx.globalAlpha = alpha
    ctx.fillText('0', cell.x, cell.y)
    ctx.restore()
  }
}
