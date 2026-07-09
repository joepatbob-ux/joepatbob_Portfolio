'use client'

import { VerdantCharacterSvg } from '@/components/VerdantCharacterSvg'
import {
  previewKind,
  stageAriaLabel,
  verdantViewToggle,
  type VerdantSelection,
} from '@/lib/verdant/characterSelector'
import type { CSSProperties } from 'react'

type Props = {
  selection: VerdantSelection
}

export function VerdantPreviewStage({ selection }: Props) {
  const kind = previewKind(selection)
  const view =
    selection.kind === 'character' ? null : verdantViewToggle(selection.kind)

  const photoStyle = view
    ? ({
        '--verdant-photo-position': view.objectPosition,
      } as CSSProperties)
    : undefined

  return (
    <div
      className="verdant-interactive__glyph-stage"
      aria-live="polite"
      aria-label={stageAriaLabel(selection)}
      data-preview={kind}
      style={photoStyle}
    >
      {selection.kind === 'character' ? (
        <VerdantCharacterSvg
          code={selection.code}
          className="verdant-interactive__glyph"
        />
      ) : view ? (
        <img
          src={view.src}
          alt={view.alt}
          className="verdant-interactive__stage-photo"
          decoding="async"
        />
      ) : null}
    </div>
  )
}
