'use client'

import {
  VERDANT_KEYBOARD_ROWS,
  keyboardKeyAriaLabel,
  keyboardKeyCode,
  type VerdantKeyboardKey,
} from '@/lib/verdant/keyboard'

interface Props {
  selectedCode: string
  onSelect: (code: string) => void
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

  return (
    <button
      type="button"
      className={[
        'verdant-keyboard__key',
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

export function VerdantCharacterKeyboard({ selectedCode, onSelect }: Props) {
  return (
    <div className="verdant-keyboard" role="group" aria-label="Character selector">
      {VERDANT_KEYBOARD_ROWS.map((row, rowIndex) => (
        <div key={rowIndex} className="verdant-keyboard__row">
          {row.map((keyDef) => (
            <KeyButton
              key={keyboardKeyCode(keyDef)}
              keyDef={keyDef}
              selected={selectedCode === keyboardKeyCode(keyDef)}
              onSelect={onSelect}
            />
          ))}
        </div>
      ))}
    </div>
  )
}
