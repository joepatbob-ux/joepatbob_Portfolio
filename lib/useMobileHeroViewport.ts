'use client'

import { useLayoutEffect } from 'react'

/**
 * Legacy hook — hero pin sizing is CSS-driven via `--mobile-viewport-min-h`.
 * Clears any stale vv custom properties from older builds.
 */
export function useMobileHeroViewport(): void {
  useLayoutEffect(() => {
    const root = document.documentElement
    root.style.removeProperty('--hero-vv-height')
    root.style.removeProperty('--hero-vv-offset-top')
    return () => {
      root.style.removeProperty('--hero-vv-height')
      root.style.removeProperty('--hero-vv-offset-top')
    }
  }, [])
}
