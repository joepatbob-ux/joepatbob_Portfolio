'use client'

import { VerdantCharacterSvg } from '@/components/VerdantCharacterSvg'
import {
  VERDANT_BOARD_IMAGE,
  VERDANT_SKETCH_IMAGE,
  previewKind,
  stageAriaLabel,
  type VerdantSelection,
} from '@/lib/verdant/characterSelector'

type Props = {
  selection: VerdantSelection
}

export function VerdantPreviewStage({ selection }: Props) {
  const kind = previewKind(selection)

  return (
    <div
      className="verdant-interactive__glyph-stage"
      aria-live="polite"
      aria-label={stageAriaLabel(selection)}
      data-preview={kind}
    >
      {selection.kind === 'character' ? (
        <VerdantCharacterSvg
          code={selection.code}
          className="verdant-interactive__glyph"
        />
      ) : (
        <img
          src={
            selection.kind === 'sketch'
              ? VERDANT_SKETCH_IMAGE
              : VERDANT_BOARD_IMAGE
          }
          alt={
            selection.kind === 'sketch'
              ? 'Verdant custom segment character set sketch'
              : 'Verdant display PCB board'
          }
          className="verdant-interactive__stage-photo"
          decoding="async"
        />
      )}
    </div>
  )
}
