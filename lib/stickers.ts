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

const STICKER_ALT_OVERRIDES: Record<string, string> = {
  'kelvin-sticker': 'Kelvin design system sticker',
  'copeland-sticker': 'Copeland launch sticker',
  'allspark-sticker': 'Allspark launch sticker',
}

export const STICKER_ASSETS: StickerAsset[] = [
  'jane-sticker-1.svg',
  'jane-sticker-2.svg',
  'jane-sticker-3.svg',
  'jane-sticker-4.svg',
  'allspark-sticker.svg',
  'botbattle-sticker.svg',
  'finex-hoodie-sticker.svg',
  'finex-hoodie-sticker-2.svg',
  'micronaut-sticker.svg',
  'bot-sticker-1.svg',
  'bot-sticker-2.svg',
  'bot-sticker-3.svg',
  'bot-sticker-4.svg',
  'copeland-sticker.svg',
  'jupiter-sticker.svg',
  'kelvin-sticker.svg',
  'kraken-sticker.svg',
  'longdog-sticker.svg',
  'mcenroe-sticker.svg',
  'tandemly-sticker.svg',
  'zoolander-sticker.svg',
].map((file) => {
  const id = file.replace(/\.svg$/i, '').toLowerCase()
  return {
    id,
    src: `/images/stickers/${file}`,
    alt: STICKER_ALT_OVERRIDES[id] ?? `${labelFromFilename(file)} launch sticker`,
  }
})

export const STICKER_SIZE_PILE = 143
export const STICKER_SIZE_PLACED = 170
export const STICKER_SIZE_PILE_MOBILE = 90
export const STICKER_SIZE_PLACED_MOBILE = 112
export const STICKER_PILE_PAD = 56
export const STICKER_PILE_PAD_MOBILE = 28

export type StickerHeights = {
  pile: number
  placed: number
  pilePad: number
}

export function stickerHeights(mobile: boolean): StickerHeights {
  return mobile
    ? {
        pile: STICKER_SIZE_PILE_MOBILE,
        placed: STICKER_SIZE_PLACED_MOBILE,
        pilePad: STICKER_PILE_PAD_MOBILE,
      }
    : {
        pile: STICKER_SIZE_PILE,
        placed: STICKER_SIZE_PLACED,
        pilePad: STICKER_PILE_PAD,
      }
}

const STICKER_SCALE_BY_ID: Record<string, number> = {
  'copeland-sticker': 0.55,
}

export function stickerScaleFor(id: string): number {
  return STICKER_SCALE_BY_ID[id] ?? 1
}

export function stickerHeight(base: number, id: string): number {
  return Math.round(base * stickerScaleFor(id))
}

/** Deterministic 0..1 from a sticker id — stable pile positions across
 * selections and reloads (index-based offsets made the whole pile shift
 * whenever the top card was taken). */
function hash01(id: string, salt: number): number {
  let h = 2166136261 ^ salt
  for (let i = 0; i < id.length; i++) {
    h ^= id.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return ((h >>> 0) % 10000) / 10000
}

/** Scatter offset for a card, keyed to the sticker itself — never its stack
 * index. Base px; CSS scales via --pile-scatter so the pile spreads on wide
 * screens without the stickers growing. */
export function pileScatterOffsetForId(
  id: string,
  mobile = false,
): { x: number; y: number } {
  const ax = mobile ? 20 : 32
  const ay = mobile ? 16 : 26
  return {
    x: Math.round((hash01(id, 1) * 2 - 1) * ax),
    y: Math.round((hash01(id, 2) * 2 - 1) * ay),
  }
}

export function pileRotationForId(id: string, mobile = false): number {
  const spread = mobile ? 26 : 22
  return Math.round((hash01(id, 3) * 2 - 1) * spread * 10) / 10
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
