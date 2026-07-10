/** Character selector — keys map to `verdant-character-{CODE}.svg` in `/images/verdant-segment/`. */

export type VerdantViewKind = 'sketch' | 'prototype' | 'final'

export type VerdantSelection =
  | { kind: 'character'; code: string }
  | { kind: VerdantViewKind }

export type CharacterKeyDef =
  | { kind: 'char'; label: string; code: string }
  | { kind: 'solid'; code: 'ALL' }
  | { kind: 'outline'; code: 'NONE' }

/** Ideal column count at full width; grid adds rows when narrower. */
export const VERDANT_SELECTOR_COLUMN_COUNT = 10

const CHARACTER_ROWS: CharacterKeyDef[][] = [
  [
    { kind: 'char', label: '0', code: '0' },
    { kind: 'char', label: '1', code: '1' },
    { kind: 'char', label: '2', code: '2' },
    { kind: 'char', label: '3', code: '3' },
    { kind: 'char', label: '4', code: '4' },
    { kind: 'char', label: '5', code: '5' },
    { kind: 'char', label: '6', code: '6' },
    { kind: 'char', label: '7', code: '7' },
    { kind: 'char', label: '8', code: '8' },
    { kind: 'char', label: '9', code: '9' },
  ],
  [
    { kind: 'char', label: 'A', code: 'A' },
    { kind: 'char', label: 'B', code: 'B' },
    { kind: 'char', label: 'C', code: 'C' },
    { kind: 'char', label: 'D', code: 'D' },
    { kind: 'char', label: 'E', code: 'E' },
    { kind: 'char', label: 'F', code: 'F' },
    { kind: 'char', label: 'G', code: 'G' },
    { kind: 'char', label: 'H', code: 'H' },
    { kind: 'char', label: 'I', code: 'I' },
    { kind: 'char', label: 'J', code: 'J' },
  ],
  [
    { kind: 'char', label: 'K', code: 'K' },
    { kind: 'char', label: 'L', code: 'L' },
    { kind: 'char', label: 'M', code: 'M' },
    { kind: 'char', label: 'N', code: 'N' },
    { kind: 'char', label: 'O', code: 'O' },
    { kind: 'char', label: 'P', code: 'P' },
    { kind: 'char', label: 'Q', code: 'Q' },
    { kind: 'char', label: 'R', code: 'R' },
    { kind: 'char', label: 'S', code: 'S' },
    { kind: 'char', label: 'T', code: 'T' },
  ],
  [
    { kind: 'char', label: 'U', code: 'U' },
    { kind: 'char', label: 'V', code: 'V' },
    { kind: 'char', label: 'W', code: 'W' },
    { kind: 'char', label: 'X', code: 'X' },
    { kind: 'char', label: 'Y', code: 'Y' },
    { kind: 'char', label: 'Z', code: 'Z' },
    { kind: 'solid', code: 'ALL' },
    { kind: 'outline', code: 'NONE' },
    { kind: 'char', label: '−', code: 'MINUS' },
    { kind: 'char', label: '+', code: 'PLUS' },
  ],
]

export const VERDANT_CHARACTER_KEYS: CharacterKeyDef[] =
  CHARACTER_ROWS.flat()

export const VERDANT_VIEW_TOGGLES = [
  {
    kind: 'sketch',
    label: 'Sketch',
    src: '/images/verdant-sketch-frame.webp',
    alt: 'Verdant custom segment character set sketch',
    objectPosition: 'center',
  },
  {
    kind: 'prototype',
    label: 'Prototype',
    src: '/images/verdant-prototype-frame.webp',
    alt: 'Verdant segment display on PCB prototype',
    objectPosition: 'center',
  },
  {
    kind: 'final',
    label: 'Final',
    src: '/images/verdant-product.webp',
    alt: 'Finished Verdant thermostat',
    objectPosition: 'center',
  },
] as const satisfies ReadonlyArray<{
  kind: VerdantViewKind
  label: string
  src: string
  alt: string
  objectPosition: string
}>

export const VERDANT_DEFAULT_SELECTION: VerdantSelection = {
  kind: 'character',
  code: 'ALL',
}

export function verdantViewToggle(
  kind: VerdantViewKind,
): (typeof VERDANT_VIEW_TOGGLES)[number] {
  const toggle = VERDANT_VIEW_TOGGLES.find((entry) => entry.kind === kind)
  if (!toggle) throw new Error(`Unknown Verdant view: ${kind}`)
  return toggle
}

export function characterKeyCode(key: CharacterKeyDef): string {
  return key.code
}

export function characterKeyAriaLabel(key: CharacterKeyDef): string {
  if (key.kind === 'solid') return 'All segments'
  if (key.kind === 'outline') return 'Blank character'
  return `Character ${key.label}`
}

export function isCharacterSelection(
  selection: VerdantSelection,
): selection is { kind: 'character'; code: string } {
  return selection.kind === 'character'
}

export function isCharacterKeySelected(
  selection: VerdantSelection,
  code: string,
): boolean {
  return selection.kind === 'character' && selection.code === code
}

export function isViewSelected(
  selection: VerdantSelection,
  kind: VerdantViewKind,
): boolean {
  return selection.kind === kind
}

export function previewKind(
  selection: VerdantSelection,
): 'segments' | VerdantViewKind {
  return selection.kind === 'character' ? 'segments' : selection.kind
}

export function stageAriaLabel(selection: VerdantSelection): string {
  if (selection.kind === 'character') return `Character ${selection.code}`
  return verdantViewToggle(selection.kind).label
}
