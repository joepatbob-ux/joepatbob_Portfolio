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

/** Split an encoded public URL for Three.js loaders (setPath + fileName). */
export function splitPublicAssetUrl(assetPath: string): {
  directory: string
  fileName: string
} {
  const lastSlash = assetPath.lastIndexOf('/')
  if (lastSlash < 0) {
    return { directory: '/', fileName: assetPath }
  }
  return {
    directory: assetPath.slice(0, lastSlash + 1),
    fileName: assetPath.slice(lastSlash + 1),
  }
}
