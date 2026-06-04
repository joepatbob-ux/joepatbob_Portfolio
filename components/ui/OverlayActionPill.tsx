'use client'

import type { ButtonHTMLAttributes } from 'react'

type Variant = 'primary' | 'secondary'

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
}

export function OverlayActionPill({
  variant = 'primary',
  className,
  type = 'button',
  children,
  ...rest
}: Props) {
  const pillClass = [
    'overlay-action-pill',
    variant === 'secondary' ? 'overlay-action-pill--secondary' : 'overlay-action-pill--primary',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <button type={type} className={pillClass} {...rest}>
      {children}
    </button>
  )
}
