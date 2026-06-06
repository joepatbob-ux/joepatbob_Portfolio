/** Layout / bounds debug overlays for the quote bowl stage. */
export function readQuoteBowlOutlinesEnabled(): boolean {
  if (typeof window === 'undefined') return false
  const params = new URLSearchParams(window.location.search)
  return params.has('bowl-outlines') || params.has('bowl-tune')
}
