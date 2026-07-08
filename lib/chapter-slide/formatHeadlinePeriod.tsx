import type { ReactNode } from 'react'

/**
 * Signature accent full stop — mirrors the hero's "ROBERTS." treatment.
 * Headlines that end with a period get it rendered in the accent color.
 */
export function formatHeadlinePeriod(text: string): ReactNode {
  const trimmed = text.trimEnd()
  if (!trimmed.endsWith('.')) return text
  return (
    <>
      {trimmed.slice(0, -1)}
      <span className="headline-period" aria-hidden="true">
        .
      </span>
    </>
  )
}
