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
      <div
        className={[
          'stage-spinner__ring',
          reducedMotion ? 'stage-spinner__ring--static' : '',
        ]
          .filter(Boolean)
          .join(' ')}
        aria-hidden
      />
      {label ? <p className="stage-spinner__label">{label}</p> : null}
    </div>
  )
}
