/** Window-level pointer drag for sticker pile + placed stickers. */

export type StickerDragListeners = {
  onMove: (clientX: number, clientY: number) => void
  onEnd: (clientX: number, clientY: number) => void
  onCancel: () => void
}

export function installStickerDragListeners(
  listeners: StickerDragListeners,
): () => void {
  const onMove = (e: PointerEvent) => {
    listeners.onMove(e.clientX, e.clientY)
  }

  const onEnd = (e: PointerEvent) => {
    listeners.onEnd(e.clientX, e.clientY)
  }

  const onKey = (e: KeyboardEvent) => {
    if (e.key === 'Escape') listeners.onCancel()
  }

  window.addEventListener('pointermove', onMove, { passive: true })
  window.addEventListener('pointerup', onEnd)
  window.addEventListener('pointercancel', onEnd)
  window.addEventListener('keydown', onKey)

  return () => {
    window.removeEventListener('pointermove', onMove)
    window.removeEventListener('pointerup', onEnd)
    window.removeEventListener('pointercancel', onEnd)
    window.removeEventListener('keydown', onKey)
  }
}
