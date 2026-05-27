import { readStickerPickMetrics } from '@/lib/stickerPickBounds'

/** Hit-test placed stickers (pointer-events: none lets wheel pass through). */

const PICK_PAD_PX = 8

function svgCircleHit(
  clientX: number,
  clientY: number,
  circle: SVGCircleElement,
  extraPad = 6,
): boolean {
  const svg = circle.ownerSVGElement
  if (!svg) return false

  const pt = svg.createSVGPoint()
  pt.x = circle.cx.baseVal.value
  pt.y = circle.cy.baseVal.value
  const ctm = circle.getScreenCTM()
  if (!ctm) return false

  const center = pt.matrixTransform(ctm)
  const r = circle.r.baseVal.value
  const stroke =
    Number.parseFloat(getComputedStyle(circle).strokeWidth) ||
    (circle.classList.contains('sticker-placed__track-hit') ? 24 : 0)
  const hitR = r + stroke / 2 + extraPad

  return Math.hypot(clientX - center.x, clientY - center.y) <= hitR
}

function placedStickerPivot(root: HTMLElement): { x: number; y: number } | null {
  const left = Number.parseFloat(root.style.left)
  const top = Number.parseFloat(root.style.top)
  if (Number.isFinite(left) && Number.isFinite(top)) {
    return { x: left, y: top }
  }
  const box = root.getBoundingClientRect()
  return { x: box.left + box.width / 2, y: box.top + box.height / 2 }
}

function stickerArtCenter(
  pivot: { x: number; y: number },
  metrics: { artOffsetX: number; artOffsetY: number },
): { x: number; y: number } {
  return {
    x: pivot.x - metrics.artOffsetX,
    y: pivot.y - metrics.artOffsetY,
  }
}

function stickerRotationDeg(root: HTMLElement): number {
  return Number.parseFloat(root.dataset.stickerRotation ?? '0') || 0
}

/** Same rule for every sticker: measured art box + rotation + small pad. */
function pointInPlacedStickerArt(
  root: HTMLElement,
  clientX: number,
  clientY: number,
): boolean {
  const pivot = placedStickerPivot(root)
  const metrics = readStickerPickMetrics(root)
  if (!pivot || !metrics) return false

  const { x: artCx, y: artCy } = stickerArtCenter(pivot, metrics)
  const rotationDeg = stickerRotationDeg(root)
  const rad = (-rotationDeg * Math.PI) / 180
  const cos = Math.cos(rad)
  const sin = Math.sin(rad)
  const dx = clientX - artCx
  const dy = clientY - artCy
  const localX = dx * cos - dy * sin
  const localY = dx * sin + dy * cos
  return (
    Math.abs(localX) <= metrics.w / 2 + PICK_PAD_PX &&
    Math.abs(localY) <= metrics.h / 2 + PICK_PAD_PX
  )
}

export function stickerInstanceAtPoint(
  clientX: number,
  clientY: number,
): string | null {
  const placed = Array.from(
    document.querySelectorAll<HTMLElement>('[data-sticker-instance]'),
  )
  const hits: HTMLElement[] = []
  for (const root of placed) {
    if (root.dataset.stickerVisible === 'false') continue
    if (pointInPlacedStickerArt(root, clientX, clientY)) {
      hits.push(root)
    }
  }

  if (hits.length === 0) return null

  hits.sort((a, b) => {
    const az =
      Number.parseInt(a.style.zIndex || '', 10) ||
      Number.parseInt(getComputedStyle(a).zIndex || '', 10) ||
      0
    const bz =
      Number.parseInt(b.style.zIndex || '', 10) ||
      Number.parseInt(getComputedStyle(b).zIndex || '', 10) ||
      0
    return bz - az
  })
  return hits[0]?.dataset.stickerInstance ?? null
}

/** Orange scrubber dot only — not the full track ring (that blocked reposition drags). */
export function rotateHandleAtPoint(
  clientX: number,
  clientY: number,
): SVGCircleElement | null {
  const stack = document.elementsFromPoint(clientX, clientY)
  for (const el of stack) {
    if (el.classList.contains('sticker-placed__scrubber-hit')) {
      return el as SVGCircleElement
    }
  }

  const selected = document.querySelector<HTMLElement>(
    '.sticker-placed--selected[data-sticker-instance]',
  )
  if (!selected) return null

  const hits = selected.querySelectorAll<SVGCircleElement>(
    '.sticker-placed__scrubber-hit',
  )
  for (const hit of hits) {
    if (svgCircleHit(clientX, clientY, hit, 4)) {
      return hit
    }
  }

  return null
}
