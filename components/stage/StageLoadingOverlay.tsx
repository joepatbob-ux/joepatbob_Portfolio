'use client'

import { StageSpinner } from '@/components/stage/StageSpinner'

type Props = {
  label?: string
  className?: string
}

export function StageLoadingOverlay({ label, className }: Props) {
  const rootClass = ['stage-loading-overlay', className]
    .filter(Boolean)
    .join(' ')

  return (
    <div className={rootClass} aria-hidden>
      <StageSpinner label={label} />
    </div>
  )
}
