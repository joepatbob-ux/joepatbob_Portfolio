import {
  VERDANT_CHARACTER_KEYS,
  VERDANT_VIEW_TOGGLES,
  characterKeyAriaLabel,
  characterKeyCode,
  isCharacterKeySelected,
  isViewSelected,
  type CharacterKeyDef,
  type VerdantSelection,
  type VerdantViewKind,
} from '@/lib/verdant/characterSelector'
import { trackEvent } from '@/lib/analytics'

type Props = {
  selection: VerdantSelection
  onSelectCharacter: (code: string) => void
  onSelectView: (kind: VerdantViewKind) => void
}

function SegmentIcon({ kind }: { kind: 'solid' | 'outline' }) {
  return (
    <span
      className={[
        'verdant-selector__icon',
        kind === 'outline' ? 'verdant-selector__icon--outline' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      aria-hidden
    />
  )
}

function CharacterKey({
  keyDef,
  selected,
  onSelect,
}: {
  keyDef: CharacterKeyDef
  selected: boolean
  onSelect: (code: string) => void
}) {
  const code = characterKeyCode(keyDef)
  const isIcon = keyDef.kind === 'solid' || keyDef.kind === 'outline'

  return (
    <button
      type="button"
      className={[
        'verdant-selector__key',
        isIcon ? 'verdant-selector__key--icon' : 'verdant-selector__key--char',
        selected ? 'verdant-selector__key--active' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      aria-label={characterKeyAriaLabel(keyDef)}
      aria-pressed={selected}
      onClick={() => {
        trackEvent('verdant', { action: 'character', character: code })
        onSelect(code)
      }}
    >
      {keyDef.kind === 'char' ? keyDef.label : <SegmentIcon kind={keyDef.kind} />}
    </button>
  )
}

function ViewToggle({
  label,
  selected,
  onSelect,
}: {
  label: string
  selected: boolean
  onSelect: () => void
}) {
  return (
    <button
      type="button"
      className={[
        'verdant-selector__key',
        'verdant-selector__key--label',
        selected ? 'verdant-selector__key--active' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      aria-pressed={selected}
      onClick={onSelect}
    >
      {label}
    </button>
  )
}

/** 4×10 character grid + Sketch / Prototype / Final view toggles. */
export function VerdantCharacterSelector({
  selection,
  onSelectCharacter,
  onSelectView,
}: Props) {
  return (
    <div className="verdant-selector" role="group" aria-label="Character selector">
      <div className="verdant-selector__matrix">
        {VERDANT_CHARACTER_KEYS.map((keyDef) => {
          const code = characterKeyCode(keyDef)
          return (
            <CharacterKey
              key={code}
              keyDef={keyDef}
              selected={isCharacterKeySelected(selection, code)}
              onSelect={onSelectCharacter}
            />
          )
        })}
      </div>
      <div className="verdant-selector__views">
        {VERDANT_VIEW_TOGGLES.map(({ kind, label }) => (
          <ViewToggle
            key={kind}
            label={label}
            selected={isViewSelected(selection, kind)}
            onSelect={() => onSelectView(kind)}
          />
        ))}
      </div>
    </div>
  )
}
