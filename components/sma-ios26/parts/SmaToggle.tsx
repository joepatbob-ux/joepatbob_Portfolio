'use client'

type SmaToggleProps = {
  checked: boolean
  onChange: (checked: boolean) => void
  label: string
}

/** iOS-style switch — Figma Toggle / Switch. */
export function SmaToggle({ checked, onChange, label }: SmaToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      className={`sma-toggle${checked ? ' sma-toggle--on' : ''}`}
      onClick={() => onChange(!checked)}
    >
      <span className="sma-toggle__knob" aria-hidden />
    </button>
  )
}
