export type VerdantSelection =
  | { kind: 'character'; code: string }
  | { kind: 'sketch' }
  | { kind: 'board' }

export const VERDANT_DEFAULT_SELECTION: VerdantSelection = {
  kind: 'character',
  code: 'ALL',
}

/** Character-set spread (sketch). */
export const VERDANT_SKETCH_IMAGE = '/images/hw-verdant-pcb.jpg'

/** PCB board photo. */
export const VERDANT_BOARD_IMAGE = '/images/hw-verdant.jpg'

export function isCharacterSelection(
  selection: VerdantSelection,
): selection is { kind: 'character'; code: string } {
  return selection.kind === 'character'
}
