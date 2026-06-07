type Props = {
  showSlip: boolean
  quote: string
  onReset?: () => void
  debugOutlines?: boolean
}

export function QuoteBowlControls({
  showSlip,
  quote,
  onReset,
  debugOutlines,
}: Props) {
  if (!showSlip && !debugOutlines) return null

  return (
    <div className="quote-bowl__controls" data-debug="controls">
      <div className="quote-bowl__slip-wrap">
        <div className="quote-bowl__slip" role="status" aria-live="polite" data-debug="slip">
          <p className="quote-bowl__quote">{quote || '\u00A0'}</p>
        </div>
      </div>
      {showSlip && onReset ? (
        <button type="button" className="quote-bowl__reset" onClick={onReset}>
          Pick again
        </button>
      ) : null}
    </div>
  )
}
