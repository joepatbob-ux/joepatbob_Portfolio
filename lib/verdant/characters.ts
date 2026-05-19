/**
 * Pre-labeled character SVGs: `/images/Verdant_Segment/verdant_charactor_{CODE}.svg`
 * Keyboard codes map 1:1 to filenames (e.g. `7` → `verdant_charactor_7.svg`, `NONE` → `verdant_charactor_NONE.svg`).
 */
export const VERDANT_CHARACTERS_BASE = '/images/Verdant_Segment'

export const VERDANT_CHAR_FILE_PREFIX = 'verdant_charactor_'

/** Characters shipped in the asset folder (filename suffix without prefix/extension). */
export const VERDANT_CHARACTER_CODES = [
  '0', '1', '2', '3', '4', '5', '6', '7', '8', '9',
  'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M',
  'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z',
  'PLUS', 'MINUS', 'NONE', 'ALL',
] as const

export type VerdantCharacterCode = (typeof VERDANT_CHARACTER_CODES)[number]

export function verdantCharacterUrl(code: string): string {
  const key = code.toUpperCase()
  return `${VERDANT_CHARACTERS_BASE}/${VERDANT_CHAR_FILE_PREFIX}${key}.svg`
}

export function isKnownVerdantCharacter(code: string): boolean {
  return VERDANT_CHARACTER_CODES.includes(
    code.toUpperCase() as VerdantCharacterCode,
  )
}
