export type AtomizeCell = {
  x: number
  y: number
  w: number
  h: number
  char: '0' | '1'
  order: number
}

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

  for (let py = y; py < yEnd; py += 2) {
    for (let px = x; px < xEnd; px += 2) {
      const i = (py * width + px) * 4
      r += data[i] ?? 0
      g += data[i + 1] ?? 0
      b += data[i + 2] ?? 0
      count += 1
    }
  }

  const luminance = (r + g + b) / (count * 3)
  return luminance > 118 ? '1' : '0'
}

export function buildAtomizeCells(
  data: Uint8ClampedArray,
  width: number,
  height: number,
  cellSize: number,
): AtomizeCell[] {
  const cells: AtomizeCell[] = []

  for (let y = 0; y < height; y += cellSize) {
    const h = Math.min(cellSize, height - y)
    for (let x = 0; x < width; x += cellSize) {
      const w = Math.min(cellSize, width - x)
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

export function drawAtomizeFrame(options: {
  ctx: CanvasRenderingContext2D
  image: CanvasImageSource
  cells: readonly AtomizeCell[]
  progress: number
  accentColor: string
  fontFamily: string
}) {
  const { ctx, image, cells, progress, accentColor, fontFamily } = options
  const { width, height } = ctx.canvas

  ctx.clearRect(0, 0, width, height)

  for (const cell of cells) {
    const atomized = progress >= cell.order

    if (!atomized) {
      ctx.drawImage(image, cell.x, cell.y, cell.w, cell.h, cell.x, cell.y, cell.w, cell.h)
      continue
    }

    const fontSize = Math.max(8, Math.floor(cell.h * 0.82))
    ctx.font = `700 ${fontSize}px ${fontFamily}`
    ctx.fillStyle = accentColor
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(cell.char, cell.x + cell.w / 2, cell.y + cell.h / 2 + fontSize * 0.04)
  }
}

export function stepAtomizeProgress(
  current: number,
  target: number,
  step = 0.11,
): number {
  if (Math.abs(target - current) < 0.01) return target
  return current + (target - current) * step
}
