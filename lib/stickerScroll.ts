/** Sticker layer binding (placed stickers use fixed viewport coords from React). */

let layerEl: HTMLElement | null = null

export function bindStickerLayerElement(el: HTMLElement | null) {
  layerEl = el
}

export function applyStickerLayerReveal(): void {
  /* No-op — visibility and position are CSS + React state. */
}
