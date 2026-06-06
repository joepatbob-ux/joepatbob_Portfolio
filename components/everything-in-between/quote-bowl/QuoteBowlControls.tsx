type Props = {
  showSlip: boolean
  quote: string
  debugOutlines?: boolean
}

export function QuoteBowlControls({ showSlip, quote, debugOutlines }: Props) {
  if (!showSlip && !debugOutlines) return null

  return (
    <div className="quote-bowl__controls" data-debug="controls">
      <div className="quote-bowl__slip-wrap">
        <div className="quote-bowl__slip" role="status" aria-live="polite" data-debug="slip">
          <p className="quote-bowl__quote">{quote || '\u00A0'}</p>
        </div>
      </div>
    </div>
  )
}
