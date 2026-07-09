export type AtomizeCell = {
  x: number
  y: number
  w: number
  h: number
  char: '0' | '1'
  order: number
  /** Sampled brightness — drives glyph opacity once atomized. */
  luminance: number
}

const CELL_BLEND = 0.14
const CHAR_LUMINANCE_MIN = 16

export function hashCell(x: number, y: number): number {
  let h = x * 374761393 + y * 668265263
  h = (h ^ (h >> 13)) * 1274126177
  return (h ^ (h >> 16)) >>> 0
}

export function cellOrder(x: number, y: number): number {
  return (hashCell(x, y) % 1000) / 1000
}

export function sampleCell(
  data: Uint8ClampedArray,
  width: number,
  x: number,
  y: number,
  w: number,
  h: number,
): { char: '0' | '1'; luminance: number } {
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

  if (count === 0) return { char: '0', luminance: 0 }

  const luminance = (r + g + b) / count
  return {
    char: luminance > 112 ? '1' : '0',
    luminance,
  }
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
      const sample = sampleCell(data, width, x, y, w, h)
      cells.push({
        x,
        y,
        w,
        h,
        char: sample.char,
        luminance: sample.luminance,
        order: cellOrder(x, y),
      })
    }
  }

  return cells
}

function cellDissolve(progress: number, order: number): number {
  return Math.max(0, Math.min(1, (progress - order) / CELL_BLEND))
}

export function drawAtomizeFrame(options: {
  ctx: CanvasRenderingContext2D
  image: CanvasImageSource
  cells: readonly AtomizeCell[]
  progress: number
  accentColor: string
  fontFamily: string
}) {
  const { ctx, image, cells, progress, accentColor, fontFamily } = options
  const displayW =
    Number(ctx.canvas.style.width.replace('px', '')) || ctx.canvas.width
  const displayH =
    Number(ctx.canvas.style.height.replace('px', '')) || ctx.canvas.height

  ctx.clearRect(0, 0, displayW, displayH)

  for (const cell of cells) {
    const dissolve = cellDissolve(progress, cell.order)

    if (dissolve < 1) {
      ctx.save()
      ctx.globalAlpha = 1 - dissolve
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

    if (dissolve <= 0 || cell.luminance < CHAR_LUMINANCE_MIN) continue

    const glyphStrength = 0.35 + (cell.luminance / 255) * 0.65
    const fontSize = Math.max(4, Math.floor(cell.h * 0.68))
    const cx = cell.x + cell.w / 2
    const cy = cell.y + cell.h / 2 + fontSize * 0.02

    ctx.save()
    ctx.globalAlpha = dissolve * glyphStrength
    ctx.font = `700 ${fontSize}px ${fontFamily}`
    ctx.fillStyle = accentColor
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    // Tighter horizontal packing — width of the glyph field carries the silhouette.
    ctx.translate(cx, cy)
    ctx.scale(0.68, 0.92)
    ctx.fillText(cell.char, 0, 0)
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

/** Ease photo fade so the board vanishes into the glyph field. */
export function photoFadeFromProgress(progress: number): number {
  const t = Math.max(0, Math.min(1, progress))
  return 1 - t * t * (3 - 2 * t)
}
