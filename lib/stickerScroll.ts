import {
  chapterRevealForId,
  easeChapterReveal,
  nearestChapterIdForDocY,
} from '@/lib/chapterSlideshow'
import { SCROLL_BLUR_PX, blurOutFromReveal } from '@/lib/scrollBlur'

let layerEl: HTMLElement | null = null
let hadVisibleSticker = false

function applyBlurOut(el: HTMLElement, reveal: number) {
  const { opacity, filter } = blurOutFromReveal(reveal, SCROLL_BLUR_PX)
  el.style.opacity = String(opacity)
  el.style.filter = filter
}

function viewportRevealForRect(rect: DOMRect): number {
  const vh = window.innerHeight
  if (rect.bottom <= 0 || rect.top >= vh) return 0
  const center = rect.top + rect.height / 2
  const distance = Math.abs(center - vh / 2)
  const range = vh * 0.75
  return easeChapterReveal(Math.max(0, 1 - distance / range))
}

/** Pin sticker to viewport so it stays in frame with fixed chapter panels. */
function positionPlacedSticker(node: HTMLElement): void {
  const x = Number(node.dataset.docX)
  const y = Number(node.dataset.docY)
  if (!Number.isFinite(x) || !Number.isFinite(y)) return
  node.style.position = 'fixed'
  node.style.left = `${x}px`
  node.style.top = `${y - window.scrollY}px`
}

/** Blur matches chapter slide + viewport edge (whichever is lower). */
function revealForPlacedSticker(node: HTMLElement): number {
  const docY = Number(node.dataset.docY)
  const chapterId = Number.isFinite(docY)
    ? nearestChapterIdForDocY(docY)
    : null
  const chapterReveal = chapterId ? chapterRevealForId(chapterId) : 0
  const viewportReveal = viewportRevealForRect(node.getBoundingClientRect())
  return Math.min(chapterReveal, viewportReveal)
}

/** Per-sticker blur + fade synced to chapter slideshow reveals. */
export function applyStickerLayerReveal(
  onHidden?: () => void,
): void {
  if (!layerEl) {
    layerEl = document.querySelector<HTMLElement>('.sticker-layer')
  }
  if (!layerEl) return

  layerEl.style.opacity = '1'
  layerEl.style.filter = 'none'

  let anyVisible = false
  const placed = layerEl.querySelectorAll<HTMLElement>('.sticker-placed')
  placed.forEach((node) => {
    positionPlacedSticker(node)
    const reveal = revealForPlacedSticker(node)
    applyBlurOut(node, reveal)
    node.style.pointerEvents = reveal > 0.32 ? 'auto' : 'none'
    if (reveal > 0.32) anyVisible = true
  })

  layerEl.setAttribute(
    'aria-hidden',
    placed.length === 0 || !anyVisible ? 'true' : 'false',
  )

  const dragGhost = document.querySelector<HTMLElement>('.sticker-layer__drag')
  if (dragGhost) {
    const rect = dragGhost.getBoundingClientRect()
    const docCenterY = rect.top + window.scrollY + rect.height / 2
    const chapterId = nearestChapterIdForDocY(docCenterY)
    const reveal = chapterId ? chapterRevealForId(chapterId) : 1
    applyBlurOut(dragGhost, reveal)
  }

  if (hadVisibleSticker && !anyVisible) {
    onHidden?.()
  }
  hadVisibleSticker = anyVisible
}

export function bindStickerLayerElement(el: HTMLElement | null) {
  layerEl = el
  hadVisibleSticker = false
}
