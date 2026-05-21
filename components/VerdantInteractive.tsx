'use client'

import { VerdantCharacterKeyboard } from '@/components/VerdantCharacterKeyboard'
import { VerdantCharacterSvg } from '@/components/VerdantCharacterSvg'
import {
  VERDANT_BOARD_IMAGE,
  VERDANT_DEFAULT_SELECTION,
  VERDANT_SKETCH_IMAGE,
  type VerdantSelection,
} from '@/lib/verdant/selection'
import { useCallback, useEffect, useState } from 'react'

interface Props {
  isActive?: boolean
}

export function VerdantInteractive({ isActive = true }: Props) {
  const [selection, setSelection] = useState<VerdantSelection>(
    VERDANT_DEFAULT_SELECTION,
  )

  const reset = useCallback(() => {
    setSelection(VERDANT_DEFAULT_SELECTION)
  }, [])

  useEffect(() => {
    if (!isActive) reset()
  }, [isActive, reset])

  const previewKind =
    selection.kind === 'character' ? 'segments' : selection.kind

  return (
    <div className="verdant-interactive">
      <div
        className="verdant-interactive__glyph-stage"
        aria-live="polite"
        data-preview={previewKind}
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
      <VerdantCharacterKeyboard
        selection={selection}
        onSelectCharacter={(code) =>
          setSelection({ kind: 'character', code })
        }
        onSelectSketch={() => setSelection({ kind: 'sketch' })}
        onSelectBoard={() => setSelection({ kind: 'board' })}
      />
    </div>
  )
}
