'use client'

import { useQuoteTypewriter } from '@/lib/everything-in-between/useQuoteTypewriter'

type Props = {
  showSlip: boolean
  slipExiting?: boolean
  quote: string
  reducedMotion: boolean
  onTypewriterComplete?: () => void
}

export function QuoteBowlControls({
  showSlip,
  slipExiting = false,
  quote,
  reducedMotion,
  onTypewriterComplete,
}: Props) {
  const typedQuote = useQuoteTypewriter(
    quote,
    showSlip,
    reducedMotion,
    onTypewriterComplete,
  )
  const displayQuote = showSlip ? typedQuote : slipExiting ? quote : ''

  if (!showSlip && !slipExiting) return null

  return (
    <div className="quote-bowl__controls">
      {showSlip || slipExiting ? (
        <div
          className={[
            'quote-bowl__slip-wrap',
            slipExiting ? 'quote-bowl__slip-wrap--exit' : '',
          ]
            .filter(Boolean)
            .join(' ')}
        >
          <div className="quote-bowl__slip" role="status" aria-live="polite" data-debug="slip">
            <p className="quote-bowl__quote">{displayQuote || '\u00A0'}</p>
          </div>
        </div>
      ) : null}
    </div>
  )
}
