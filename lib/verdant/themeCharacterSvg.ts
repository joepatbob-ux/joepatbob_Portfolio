import { verdantCharacterUrl } from '@/lib/verdant/characters'

const themedCache = new Map<string, string>()

/** Map export fills (black / #BBBBBB) to segment classes (styled in globals.css). */
export function themeVerdantCharacterSvg(svgText: string): string {
  return svgText
    .replace(/<svg\b/, '<svg class="verdant-char-art"')
    .replace(/\bfill="black"/gi, 'class="verdant-char-seg verdant-char-seg--on"')
    .replace(/\bfill="#000000"/gi, 'class="verdant-char-seg verdant-char-seg--on"')
    .replace(/\bfill="#000"/gi, 'class="verdant-char-seg verdant-char-seg--on"')
    .replace(/\bfill="#BBBBBB"/gi, 'class="verdant-char-seg verdant-char-seg--off"')
    .replace(/\bfill="#bbbbbb"/gi, 'class="verdant-char-seg verdant-char-seg--off"')
}

export function getCachedThemedVerdantCharacterSvg(
  code: string,
): string | undefined {
  return themedCache.get(code.toUpperCase())
}

export async function fetchThemedVerdantCharacterSvg(
  code: string,
): Promise<string> {
  const key = code.toUpperCase()
  const cached = themedCache.get(key)
  if (cached) return cached

  const res = await fetch(verdantCharacterUrl(key))
  if (!res.ok) {
    throw new Error(`Verdant character SVG not found: ${key}`)
  }

  const themed = themeVerdantCharacterSvg(await res.text())
  themedCache.set(key, themed)
  return themed
}
