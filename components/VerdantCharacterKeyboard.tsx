'use client'

import {
  VERDANT_KEYBOARD_ROWS,
  keyboardKeyAriaLabel,
  keyboardKeyCode,
  type VerdantKeyboardKey,
} from '@/lib/verdant/keyboard'
import type { VerdantSelection } from '@/lib/verdant/selection'

interface Props {
  selection: VerdantSelection
  onSelectCharacter: (code: string) => void
  onSelectSketch: () => void
  onSelectBoard: () => void
}

function KeyIcon({ kind }: { kind: 'solid' | 'outline' }) {
  return (
    <span
      className={[
        'verdant-keyboard__icon',
        kind === 'outline' ? 'verdant-keyboard__icon--outline' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      aria-hidden
    />
  )
}

function KeyButton({
  keyDef,
  selected,
  onSelect,
}: {
  keyDef: VerdantKeyboardKey
  selected: boolean
  onSelect: (code: string) => void
}) {
  const code = keyboardKeyCode(keyDef)

  const isIcon = keyDef.kind === 'solid' || keyDef.kind === 'outline'

  return (
    <button
      type="button"
      className={[
        'verdant-keyboard__key',
        isIcon ? 'verdant-keyboard__key--icon' : 'verdant-keyboard__key--char',
        selected ? 'verdant-keyboard__key--active' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      aria-label={keyboardKeyAriaLabel(keyDef)}
      aria-pressed={selected}
      onClick={() => onSelect(code)}
    >
      {keyDef.kind === 'char' ? (
        keyDef.label
      ) : (
        <KeyIcon kind={keyDef.kind} />
      )}
    </button>
  )
}

export function VerdantCharacterKeyboard({
  selection,
  onSelectCharacter,
  onSelectSketch,
  onSelectBoard,
}: Props) {
  const characterActive = selection.kind === 'character'

  return (
    <div className="verdant-keyboard" role="group" aria-label="Character selector">
      <div className="verdant-keyboard__matrix">
        {VERDANT_KEYBOARD_ROWS.map((row, rowIndex) => (
          <div
            key={rowIndex}
            className={[
              'verdant-keyboard__row',
              rowIndex === VERDANT_KEYBOARD_ROWS.length - 1
                ? 'verdant-keyboard__row--mixed'
                : 'verdant-keyboard__row--chars',
            ].join(' ')}
          >
            {row.map((keyDef) => (
              <KeyButton
                key={keyboardKeyCode(keyDef)}
                keyDef={keyDef}
                selected={
                  characterActive &&
                  selection.code === keyboardKeyCode(keyDef)
                }
                onSelect={onSelectCharacter}
              />
            ))}
          </div>
        ))}
      </div>
      <div className="verdant-keyboard__row verdant-keyboard__row--views">
        <button
          type="button"
          className={[
            'verdant-keyboard__key',
            'verdant-keyboard__key--label',
            selection.kind === 'sketch' ? 'verdant-keyboard__key--active' : '',
          ]
            .filter(Boolean)
            .join(' ')}
          aria-pressed={selection.kind === 'sketch'}
          onClick={onSelectSketch}
        >
          Sketch
        </button>
        <button
          type="button"
          className={[
            'verdant-keyboard__key',
            'verdant-keyboard__key--label',
            selection.kind === 'board' ? 'verdant-keyboard__key--active' : '',
          ]
            .filter(Boolean)
            .join(' ')}
          aria-pressed={selection.kind === 'board'}
          onClick={onSelectBoard}
        >
          Board
        </button>
      </div>
    </div>
  )
}
