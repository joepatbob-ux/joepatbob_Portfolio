declare global {
  interface Window {
    /** Set by scripts/prerender.mjs via evaluateOnNewDocument before snapshot. */
    __PRERENDER?: boolean
  }
}

/** True while Puppeteer is capturing the post-build prerender snapshot. */
export function isPrerenderSnapshot(): boolean {
  if (typeof window === 'undefined') return false
  if (window.__PRERENDER === true) return true
  try {
    return new URLSearchParams(window.location.search).get('prerender') === '1'
  } catch {
    return false
  }
}
