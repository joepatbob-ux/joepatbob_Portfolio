/** Pointer position in scratch canvas logical pixels (matches display size). */

export type ScratchPoint = { x: number; y: number }

export function scratchPointFromEvent(
  e: PointerEvent,
  canvas: HTMLCanvasElement,
): ScratchPoint {
  const rect = canvas.getBoundingClientRect()
  return {
    x: e.clientX - rect.left,
    y: e.clientY - rect.top,
  }
}

export function paintTicketCover(
  ctx: CanvasRenderingContext2D,
  cover: CanvasImageSource,
  width: number,
  height: number,
): void {
  ctx.globalCompositeOperation = 'source-over'
  ctx.clearRect(0, 0, width, height)
  ctx.drawImage(cover, 0, 0, width, height)
}

export function scratchStroke(
  ctx: CanvasRenderingContext2D,
  from: ScratchPoint,
  to: ScratchPoint,
  brush: CanvasImageSource,
  brushW: number,
  brushH: number,
): void {
  const dx = to.x - from.x
  const dy = to.y - from.y
  const distance = Math.hypot(dx, dy)
  const angle = Math.atan2(dy, dx)

  ctx.save()
  ctx.globalCompositeOperation = 'destination-out'
  for (let i = 0; i <= distance; i++) {
    const x = from.x + Math.cos(angle) * i
    const y = from.y + Math.sin(angle) * i
    ctx.drawImage(brush, x - brushW / 2, y - brushH / 2, brushW, brushH)
  }
  ctx.restore()
}

/** Rough % of foil erased (alpha channel). */
export function scratchErasedPercent(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  stride = 8,
): number {
  const { data } = ctx.getImageData(0, 0, width, height)
  let total = 0
  let erased = 0
  for (let y = 0; y < height; y += stride) {
    for (let x = 0; x < width; x += stride) {
      total++
      if (data[(y * width + x) * 4 + 3] === 0) erased++
    }
  }
  return total === 0 ? 0 : Math.round((erased / total) * 100)
}
