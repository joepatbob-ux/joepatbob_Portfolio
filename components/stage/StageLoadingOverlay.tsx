'use client'

import { StageSpinner } from '@/components/stage/StageSpinner'

type Props = {
  label?: string
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

export function StageLoadingOverlay({ label, className, size = 'md' }: Props) {
  const rootClass = ['stage-loading-overlay', className]
    .filter(Boolean)
    .join(' ')

  return (
    <div className={rootClass}>
      <StageSpinner label={label} size={size} />
    </div>
  )
}
