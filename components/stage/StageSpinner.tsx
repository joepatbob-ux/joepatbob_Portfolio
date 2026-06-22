'use client'

import { MorphIcon } from '@/components/preloader/MorphIcon'

type Props = {
  label?: string
  className?: string
}

export function StageSpinner({ label, className }: Props) {
  const rootClass = ['stage-spinner', className].filter(Boolean).join(' ')

  return (
    <div className={rootClass} role="status" aria-live="polite" aria-busy="true">
      <MorphIcon size={28} aria-hidden />
      {label ? <p className="stage-spinner__label">{label}</p> : null}
    </div>
  )
}
