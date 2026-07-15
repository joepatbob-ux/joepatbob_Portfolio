import { useEffect, useState } from 'react'
import {
  INTERLUDE_COPY_STYLE_LABELS,
  INTERLUDE_COPY_STYLES,
  saveInterludeCopyStylePick,
  type InterludeCopyStyle,
} from '@/lib/interludeCopyStyle'
import {
  INTERLUDE_LAYOUT_LABELS,
  INTERLUDE_LAYOUTS,
  isInterludeDevPickerEnabled,
  saveInterludeLayoutPick,
  type InterludeLayout,
} from '@/lib/interludeLayout'

interface Props {
  layout: InterludeLayout
  copyStyle: InterludeCopyStyle
  onLayoutChange: (layout: InterludeLayout) => void
  onCopyStyleChange: (style: InterludeCopyStyle) => void
}

/** Dev-only pickers — `?interludeLayout=1` and/or `?interludeCopy=1` on localhost. */
export function InterludeLayoutPicker({
  layout,
  copyStyle,
  onLayoutChange,
  onCopyStyleChange,
}: Props) {
  const [enabled, setEnabled] = useState(false)

  useEffect(() => {
    setEnabled(isInterludeDevPickerEnabled())
  }, [])

  if (!enabled) return null

  return (
    <div className="interlude-dev-picker" role="toolbar" aria-label="Interlude layout options">
      <section className="interlude-dev-picker__group">
        <span className="interlude-dev-picker__label">Page layout</span>
        {INTERLUDE_LAYOUTS.map((id) => (
          <button
            key={id}
            type="button"
            className={[
              'interlude-dev-picker__btn',
              layout === id ? 'interlude-dev-picker__btn--active' : '',
            ]
              .filter(Boolean)
              .join(' ')}
            aria-pressed={layout === id}
            onClick={() => {
              saveInterludeLayoutPick(id)
              onLayoutChange(id)
            }}
          >
            {INTERLUDE_LAYOUT_LABELS[id]}
          </button>
        ))}
      </section>
      <section className="interlude-dev-picker__group">
        <span className="interlude-dev-picker__label">Copy style</span>
        {INTERLUDE_COPY_STYLES.map((id) => (
          <button
            key={id}
            type="button"
            className={[
              'interlude-dev-picker__btn',
              copyStyle === id ? 'interlude-dev-picker__btn--active' : '',
            ]
              .filter(Boolean)
              .join(' ')}
            aria-pressed={copyStyle === id}
            onClick={() => {
              saveInterludeCopyStylePick(id)
              onCopyStyleChange(id)
            }}
          >
            {INTERLUDE_COPY_STYLE_LABELS[id]}
          </button>
        ))}
      </section>
    </div>
  )
}
