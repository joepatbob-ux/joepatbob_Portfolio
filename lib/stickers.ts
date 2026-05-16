export interface StickerAsset {
  id: string
  src: string
  alt: string
}

function labelFromFilename(filename: string): string {
  const base = filename.replace(/\.svg$/i, '')
  return base
    .replace(/[-_]+/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/\bsticker\b/gi, '')
    .trim()
}

export const STICKER_ASSETS: StickerAsset[] = [
  'Jane-Sticker1.svg',
  'Jane-Sticker2.svg',
  'Jane-Sticker3.svg',
  'Jane-Sticker4.svg',
  'Allspark_sticker.svg',
  'Botbattle_sticker.svg',
  'FinexHoodie-Sticker.svg',
  'FinexHoodie-Sticker2.svg',
  'Micronaut_sticker.svg',
  'bot_sticker1.svg',
  'bot_sticker2.svg',
  'bot_sticker3.svg',
  'bot_sticker4.svg',
  'copeland_sticker.svg',
  'jupiter_sticker.svg',
  'kraken_sticker.svg',
  'longdog_sticker.svg',
  'mcenroe_sticker.svg',
  'tandemly_sticker.svg',
  'zoolander_sticker.svg',
].map((file) => {
  const id = file.replace(/\.svg$/i, '').toLowerCase()
  return {
    id,
    src: `/Stickers/${file}`,
    alt: `${labelFromFilename(file)} launch sticker`,
  }
})

export const STICKER_SIZE_PILE = 184
export const STICKER_SIZE_PLACED = 216

const STICKER_SCALE_BY_ID: Record<string, number> = {
  copeland_sticker: 0.55,
}

export function stickerScaleFor(id: string): number {
  return STICKER_SCALE_BY_ID[id] ?? 1
}

export function stickerHeight(base: number, id: string): number {
  return Math.round(base * stickerScaleFor(id))
}

/** Fan offset for a card in the pile (0 = top, total - 1 = bottom). */
export function pileStackOffset(indexFromTop: number, total: number): { x: number; y: number } {
  if (total <= 1) return { x: 0, y: 0 }
  const depth = indexFromTop / (total - 1)
  return {
    x: Math.round(14 * depth),
    y: Math.round(11 * depth),
  }
}

export function randomPileRotation(): number {
  return Math.round((Math.random() * 30 - 15) * 10) / 10
}

export function uniqueStickerDeck(assets: StickerAsset[]): StickerAsset[] {
  const seen = new Set<string>()
  return assets.filter((asset) => {
    if (seen.has(asset.id)) return false
    seen.add(asset.id)
    return true
  })
}

/**
 * Pile order: STICKER_ASSETS[0] on top (grab first), last asset on bottom.
 * Preserves saved deck order when restoring; appends any missing in catalog order.
 */
export function buildOrderedDeck(
  placedAssetIds: Set<string>,
  savedDeckIds?: string[],
): StickerAsset[] {
  if (savedDeckIds?.length) {
    const byId = new Map(STICKER_ASSETS.map((s) => [s.id, s]))
    const fromSaved = savedDeckIds
      .map((id) => byId.get(id))
      .filter((s): s is StickerAsset => s != null && !placedAssetIds.has(s.id))
    const inDeck = new Set(fromSaved.map((s) => s.id))
    const missing = STICKER_ASSETS.filter(
      (a) => !placedAssetIds.has(a.id) && !inDeck.has(a.id),
    )
    return uniqueStickerDeck([...fromSaved, ...missing])
  }

  return STICKER_ASSETS.filter((a) => !placedAssetIds.has(a.id))
}
