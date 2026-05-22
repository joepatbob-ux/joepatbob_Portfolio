/** Hit-test placed stickers (pointer-events: none lets wheel pass through). */

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

export function stickerInstanceAtPoint(
  clientX: number,
  clientY: number,
): string | null {
  const stack = document.elementsFromPoint(clientX, clientY)
  for (const el of stack) {
    const root = el.closest('[data-sticker-instance]') as HTMLElement | null
    if (root?.dataset.stickerInstance) {
      return root.dataset.stickerInstance
    }
  }

  const placed = Array.from(
    document.querySelectorAll<HTMLElement>('[data-sticker-instance]'),
  )
  for (const root of placed) {
    if (root.dataset.stickerVisible === 'false') continue
    const rect = root.getBoundingClientRect()
    if (
      clientX >= rect.left &&
      clientX <= rect.right &&
      clientY >= rect.top &&
      clientY <= rect.bottom
    ) {
      return root.dataset.stickerInstance ?? null
    }
  }

  return null
}

export function rotateHandleAtPoint(
  clientX: number,
  clientY: number,
): SVGCircleElement | null {
  const stack = document.elementsFromPoint(clientX, clientY)
  for (const el of stack) {
    if (
      el.classList.contains('sticker-placed__track-hit') ||
      el.classList.contains('sticker-placed__scrubber-hit')
    ) {
      return el as SVGCircleElement
    }
  }

  const selected = document.querySelector<HTMLElement>(
    '.sticker-placed--selected[data-sticker-instance]',
  )
  if (!selected) return null

  const hits = Array.from(
    selected.querySelectorAll<SVGCircleElement>(
      '.sticker-placed__track-hit, .sticker-placed__scrubber-hit',
    ),
  )
  for (const hit of hits) {
    const pad = hit.classList.contains('sticker-placed__scrubber-hit') ? 4 : 8
    if (svgCircleHit(clientX, clientY, hit, pad)) {
      return hit
    }
  }

  return null
}
