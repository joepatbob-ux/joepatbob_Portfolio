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

/** Fisher–Yates shuffle; index 0 is the top of the pile. */
export function shuffleStickerDeck(assets: StickerAsset[]): StickerAsset[] {
  const deck = [...assets]
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    const tmp = deck[i]
    deck[i] = deck[j]
    deck[j] = tmp
  }
  return deck
}

/** deck[0] is the top of the pile (grab first). */
export function createShuffledDeck(placedAssetIds: Set<string>): StickerAsset[] {
  const available = STICKER_ASSETS.filter((a) => !placedAssetIds.has(a.id))
  return shuffleStickerDeck(available)
}

/** Restore pile order from saved ids (top first); shuffles any catalog additions. */
export function deckFromOrderedIds(
  orderedIds: string[],
  placedAssetIds: Set<string>,
): StickerAsset[] {
  const byId = new Map(STICKER_ASSETS.map((s) => [s.id, s]))
  const fromSaved = orderedIds
    .map((id) => byId.get(id))
    .filter((s): s is StickerAsset => s != null && !placedAssetIds.has(s.id))
  const inDeck = new Set(fromSaved.map((s) => s.id))
  const missing = STICKER_ASSETS.filter(
    (a) => !placedAssetIds.has(a.id) && !inDeck.has(a.id),
  )
  return uniqueStickerDeck([...fromSaved, ...shuffleStickerDeck(missing)])
}

export const STICKER_DECK_ORDER_KEY = 'joepatbob-sticker-deck-order-v1'

export function readStoredDeckIds(): string[] | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.sessionStorage.getItem(STICKER_DECK_ORDER_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return null
    return parsed.filter((id): id is string => typeof id === 'string')
  } catch {
    return null
  }
}

export function writeStoredDeckIds(ids: string[]): void {
  if (typeof window === 'undefined') return
  try {
    window.sessionStorage.setItem(STICKER_DECK_ORDER_KEY, JSON.stringify(ids))
  } catch {
    /* ignore */
  }
}
