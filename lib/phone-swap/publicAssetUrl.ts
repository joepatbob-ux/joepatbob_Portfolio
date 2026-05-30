/** Encode each path segment so spaces/special chars work on production static hosts. */
export function publicAssetUrl(path: string): string {
  const trimmed = path.trim()
  if (!trimmed) return '/'
  const withLeading = trimmed.startsWith('/') ? trimmed : `/${trimmed}`
  return withLeading
    .split('/')
    .map((segment, index) => (index === 0 ? segment : encodeURIComponent(segment)))
    .join('/')
}
