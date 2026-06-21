'use client'

import { usePrefersReducedMotion } from '@/lib/hooks/usePrefersReducedMotion'

type Props = {
  label?: string
  className?: string
}

export function StageSpinner({ label, className }: Props) {
  const reducedMotion = usePrefersReducedMotion()
  const rootClass = ['stage-spinner', className].filter(Boolean).join(' ')

  return (
    <div className={rootClass} role="status" aria-live="polite" aria-busy="true">
      <div className="stage-spinner__dot-wrap" aria-hidden>
        <span
          className={[
            'stage-spinner__pulse',
            reducedMotion ? 'stage-spinner__pulse--static' : '',
          ]
            .filter(Boolean)
            .join(' ')}
        />
        <span className="stage-spinner__dot" />
      </div>
      {label ? <p className="stage-spinner__label">{label}</p> : null}
    </div>
  )
}
