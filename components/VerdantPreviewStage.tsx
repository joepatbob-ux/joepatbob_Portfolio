'use client'

import { VerdantCharacterSvg } from '@/components/VerdantCharacterSvg'
import {
  previewKind,
  stageAriaLabel,
  verdantViewToggle,
  type VerdantSelection,
} from '@/lib/verdant/characterSelector'

type Props = {
  selection: VerdantSelection
}

export function VerdantPreviewStage({ selection }: Props) {
  const kind = previewKind(selection)
  const view =
    selection.kind === 'character' ? null : verdantViewToggle(selection.kind)

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
          src={view.src}
          alt={view.alt}
          className="verdant-interactive__stage-photo"
          decoding="async"
        />
      )}
    </div>
  )
}
