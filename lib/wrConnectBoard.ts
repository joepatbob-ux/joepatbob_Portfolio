export type BoardGlyph = {
  x: number
  y: number
  weight: number
}

export type FitRect = {
  x: number
  y: number
  w: number
  h: number
}

export const BOARD_ASPECT = '2044 / 1476'
export const BOARD_GLYPH_GAP = 2
export const BOARD_BRUSH_RADIUS = 80

export function containRect(
  containerW: number,
  containerH: number,
  contentW: number,
  contentH: number,
): FitRect {
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
  gap = BOARD_GLYPH_GAP,
): BoardGlyph[] {
  const cells: BoardGlyph[] = []

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

function brushStrength(
  mouse: { x: number; y: number },
  cell: BoardGlyph,
  radius: number,
): number {
  const dx = mouse.x - cell.x
  const dy = mouse.y - cell.y
  const dist = Math.sqrt(dx * dx + dy * dy)
  if (dist >= radius) return 0
  const t = 1 - dist / radius
  return 1 - (1 - t) ** 3
}

export function drawWrConnectBoard(options: {
  ctx: CanvasRenderingContext2D
  image: CanvasImageSource
  imageFit: FitRect
  cells: readonly BoardGlyph[]
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

  const fontSize = Math.max(3, BOARD_GLYPH_GAP + 1)
  const holeRadius = fontSize * 0.55
  const brushed: { cell: BoardGlyph; strength: number }[] = []

  for (const cell of cells) {
    const strength = brushStrength(mouse, cell, BOARD_BRUSH_RADIUS)
    if (strength > 0.03) brushed.push({ cell, strength })
  }

  if (brushed.length === 0) return

  ctx.save()
  ctx.globalCompositeOperation = 'destination-out'
  for (const { cell, strength } of brushed) {
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

  for (const { cell, strength } of brushed) {
    const alpha = strength * cell.weight
    if (alpha <= 0.02) continue
    ctx.save()
    ctx.globalAlpha = alpha
    ctx.fillText('0', cell.x, cell.y)
    ctx.restore()
  }
}

export function loadBoardImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const image = new Image()
    image.decoding = 'async'
    image.onload = () => resolve(image)
    image.onerror = () => resolve(null)
    image.src = src
  })
}

export function preloadBoardImage(src: string): void {
  void loadBoardImage(src)
}
