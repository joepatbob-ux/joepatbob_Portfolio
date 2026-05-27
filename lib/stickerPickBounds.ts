import { measureStickerOpticalLayout } from '@/lib/stickerOptical'
import { STICKER_SIZE_PLACED, stickerHeight } from '@/lib/stickers'

export interface StickerArtMetrics {
  bodyW: number
  bodyH: number
  outerR: number
  artOffsetX: number
  artOffsetY: number
}

export function measureStickerArt(
  img: HTMLImageElement,
  assetId: string,
): StickerArtMetrics {
  let w = img.offsetWidth
  let h = img.offsetHeight
  if (w <= 0 || h <= 0) {
    h = stickerHeight(STICKER_SIZE_PLACED, assetId)
    const aspect =
      img.naturalWidth > 0 && img.naturalHeight > 0
        ? img.naturalWidth / img.naturalHeight
        : 1
    w = h * aspect
  }
  const optical = measureStickerOpticalLayout(img, w, h)
  const outerR = optical?.outerRadius ?? Math.hypot(w, h) / 2
  return {
    bodyW: w,
    bodyH: h,
    outerR,
    artOffsetX: optical?.offsetX ?? 0,
    artOffsetY: optical?.offsetY ?? 0,
  }
}

export interface StickerPickMetrics {
  w: number
  h: number
  artOffsetX: number
  artOffsetY: number
}

/** Read stored measure from data-* or remeasure from the placed img. */
export function readStickerPickMetrics(
  root: HTMLElement,
): StickerPickMetrics | null {
  const w = Number.parseFloat(root.dataset.pickW ?? '')
  const h = Number.parseFloat(root.dataset.pickH ?? '')
  if (w > 1 && h > 1) {
    return {
      w,
      h,
      artOffsetX: Number.parseFloat(root.dataset.pickOx ?? '0') || 0,
      artOffsetY: Number.parseFloat(root.dataset.pickOy ?? '0') || 0,
    }
  }

  const assetId = root.dataset.stickerAssetId ?? ''
  const img = root.querySelector('img.sticker__art') as HTMLImageElement | null
  if (!img || !assetId) return null

  const art = measureStickerArt(img, assetId)
  return {
    w: art.bodyW,
    h: art.bodyH,
    artOffsetX: art.artOffsetX,
    artOffsetY: art.artOffsetY,
  }
}

export function writeStickerPickData(
  root: HTMLElement,
  metrics: StickerPickMetrics,
): void {
  root.dataset.pickW = String(metrics.w)
  root.dataset.pickH = String(metrics.h)
  root.dataset.pickOx = String(metrics.artOffsetX)
  root.dataset.pickOy = String(metrics.artOffsetY)
}
