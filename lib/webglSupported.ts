let cached: boolean | null = null

/**
 * Whether this browser can create a WebGL context. iOS in-app browsers
 * (Threads/Instagram WebViews) under memory pressure can return null here —
 * and because the phone-swap scene's render loop runs in requestAnimationFrame
 * (outside React's error boundary), letting it mount anyway surfaced as
 * uncaught "undefined is not an object" client-errors. Gate the 3D scene on
 * this and show a static fallback instead. Detected once and cached.
 */
export function webglSupported(): boolean {
  if (cached !== null) return cached
  if (typeof document === 'undefined') return true // SSR/prerender: assume capable
  try {
    const canvas = document.createElement('canvas')
    cached = Boolean(
      canvas.getContext('webgl2') ||
        canvas.getContext('webgl') ||
        canvas.getContext('experimental-webgl'),
    )
  } catch {
    cached = false
  }
  return cached
}
