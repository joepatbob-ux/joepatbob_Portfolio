type Props = {
  showSlip: boolean
  typedQuote: string
}

export function QuoteBowlControls({ showSlip, typedQuote }: Props) {
  if (!showSlip) return null

  return (
    <div className="quote-bowl__controls">
      <div className="quote-bowl__slip-wrap">
        <div className="quote-bowl__slip" role="status" aria-live="polite">
          <p className="quote-bowl__quote">{typedQuote || '\u00A0'}</p>
        </div>
      </div>
    </div>
  )
}
