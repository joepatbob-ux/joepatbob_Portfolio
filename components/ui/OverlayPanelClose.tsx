import { OverlayActionPill } from '@/components/ui/OverlayActionPill'
import type { ButtonHTMLAttributes } from 'react'

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  label?: string
}

/** Full-width secondary Close — mobile nav drawer + Learn More sheet. */
export function OverlayPanelClose({
  label = 'Close',
  className,
  type = 'button',
  ...rest
}: Props) {
  return (
    <OverlayActionPill
      type={type}
      variant="secondary"
      className={[
        'overlay-action-pill--full-width',
        'sidebar-overlay-close',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      {...rest}
    >
      {label}
    </OverlayActionPill>
  )
}
