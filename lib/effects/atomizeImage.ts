export type AtomizeCell = {
  x: number
  y: number
  w: number
  h: number
  char: '0' | '1'
  order: number
}

const CELL_BLEND = 0.14
/** Photo fully hidden once atomize progress crosses this (ease-out within). */
const PHOTO_HIDE_PROGRESS = 0.32

export function hashCell(x: number, y: number): number {
  let h = x * 374761393 + y * 668265263
  h = (h ^ (h >> 13)) * 1274126177
  return (h ^ (h >> 16)) >>> 0
}

export function cellOrder(x: number, y: number): number {
  return (hashCell(x, y) % 1000) / 1000
}

export function sampleCellChar(
  data: Uint8ClampedArray,
  width: number,
  x: number,
  y: number,
  w: number,
  h: number,
): '0' | '1' {
  let r = 0
  let g = 0
  let b = 0
  let count = 0

  const xEnd = Math.min(x + w, width)
  const yEnd = y + h

  for (let py = y; py < yEnd; py += 1) {
    for (let px = x; px < xEnd; px += 1) {
      const i = (py * width + px) * 4
      const alpha = (data[i + 3] ?? 255) / 255
      if (alpha < 0.04) continue
      r += (data[i] ?? 0) * alpha
      g += (data[i + 1] ?? 0) * alpha
      b += (data[i + 2] ?? 0) * alpha
      count += 1
    }
  }

  if (count === 0) return '0'

  const luminance = (r + g + b) / count
  return luminance > 108 ? '1' : '0'
}

export function buildAtomizeCells(
  data: Uint8ClampedArray,
  width: number,
  height: number,
  cellW: number,
  cellH: number,
): AtomizeCell[] {
  const cells: AtomizeCell[] = []

  for (let y = 0; y < height; y += cellH) {
    const h = Math.min(cellH, height - y)
    for (let x = 0; x < width; x += cellW) {
      const w = Math.min(cellW, width - x)
      cells.push({
        x,
        y,
        w,
        h,
        char: sampleCellChar(data, width, x, y, w, h),
        order: cellOrder(x, y),
      })
    }
  }

  return cells
}

function cellDissolve(progress: number, order: number): number {
  return Math.max(0, Math.min(1, (progress - order) / CELL_BLEND))
}

export function easeOutCubic(t: number): number {
  const x = Math.max(0, Math.min(1, t))
  return 1 - Math.pow(1 - x, 3)
}

/** Photo fades out quickly in the first ~32% of atomize progress. */
export function photoOpacityFromProgress(progress: number): number {
  const t = Math.min(1, Math.max(0, progress) / PHOTO_HIDE_PROGRESS)
  return 1 - easeOutCubic(t)
}

export function drawAtomizeFrame(options: {
  ctx: CanvasRenderingContext2D
  image: CanvasImageSource
  cells: readonly AtomizeCell[]
  progress: number
  glyphColor: string
  fieldColor: string
  fontFamily: string
}) {
  const { ctx, image, cells, progress, glyphColor, fieldColor, fontFamily } =
    options
  const displayW =
    Number(ctx.canvas.style.width.replace('px', '')) || ctx.canvas.width
  const displayH =
    Number(ctx.canvas.style.height.replace('px', '')) || ctx.canvas.height

  ctx.clearRect(0, 0, displayW, displayH)

  const photoOpacity = photoOpacityFromProgress(progress)
  const fieldAlpha = 1 - photoOpacity

  if (fieldAlpha > 0.01) {
    ctx.fillStyle = fieldColor
    ctx.globalAlpha = fieldAlpha
    ctx.fillRect(0, 0, displayW, displayH)
    ctx.globalAlpha = 1
  }

  const fontSize = Math.max(5, Math.floor((cells[0]?.h ?? 7) - 1))
  ctx.font = `400 ${fontSize}px ${fontFamily}`
  ctx.fillStyle = glyphColor
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'

  const drawPhoto = photoOpacity > 0.02

  for (const cell of cells) {
    const dissolve = cellDissolve(progress, cell.order)

    if (drawPhoto && dissolve < 1) {
      ctx.save()
      ctx.globalAlpha = (1 - dissolve) * photoOpacity
      ctx.drawImage(
        image,
        cell.x,
        cell.y,
        cell.w,
        cell.h,
        cell.x,
        cell.y,
        cell.w,
        cell.h,
      )
      ctx.restore()
    }

    if (dissolve <= 0) continue

    ctx.save()
    ctx.globalAlpha = dissolve
    ctx.fillText(cell.char, cell.x + cell.w / 2, cell.y + cell.h / 2)
    ctx.restore()
  }
}

export function stepAtomizeProgress(
  current: number,
  target: number,
  step = 0.085,
): number {
  if (Math.abs(target - current) < 0.008) return target
  return current + (target - current) * step
}
