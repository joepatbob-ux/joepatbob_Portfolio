'use client'

import type { CSSProperties } from 'react'

const ICON_PX = { sm: 22, md: 28, lg: 40 } as const

export type StageSpinnerSize = keyof typeof ICON_PX

type Props = {
  label?: string
  className?: string
  size?: StageSpinnerSize
}

export function StageSpinner({ label, className, size = 'md' }: Props) {
  const iconSize = ICON_PX[size]
  const rootClass = ['stage-spinner', `stage-spinner--${size}`, className]
    .filter(Boolean)
    .join(' ')

  return (
    <div
      className={rootClass}
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label={label ?? 'Loading'}
      style={{ '--stage-spinner-icon-size': `${iconSize}px` } as CSSProperties}
    >
      <div className="stage-spinner__halo" aria-hidden>
        <span className="stage-spinner__ring" />
        <span className="stage-spinner__pulse" />
      </div>
      {label ? <p className="stage-spinner__label">{label}</p> : null}
    </div>
  )
}

/** Sized shell for next/dynamic and other lazy stage chunks. */
export function StageLoadingFallback({
  label = 'Loading…',
  className,
}: {
  label?: string
  className?: string
}) {
  const rootClass = ['stage-spinner-fallback', className].filter(Boolean).join(' ')

  return (
    <div className={rootClass}>
      <StageSpinner label={label} size="md" />
    </div>
  )
}
