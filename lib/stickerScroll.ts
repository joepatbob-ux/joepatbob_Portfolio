/** Scroll frame only re-pins placed sticker positions (never opacity). */

let layerEl: HTMLElement | null = null

export function pinPlacedStickerToViewport(node: HTMLElement): void {
  const x = Number(node.dataset.clientX)
  const y = Number(node.dataset.clientY)
  if (!Number.isFinite(x) || !Number.isFinite(y)) return
  node.style.position = 'fixed'
  node.style.left = `${x}px`
  node.style.top = `${y}px`
}

/** Re-apply fixed pins after scroll/resize; visibility is CSS-only. */
export function applyStickerLayerReveal(): void {
  if (!layerEl) {
    layerEl = document.querySelector<HTMLElement>('.sticker-layer')
  }
  if (!layerEl) return

  layerEl.querySelectorAll<HTMLElement>('.sticker-placed').forEach((node) => {
    pinPlacedStickerToViewport(node)
  })
}

export function bindStickerLayerElement(el: HTMLElement | null) {
  layerEl = el
}
