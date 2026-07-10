/** Bottom-center of Touch 2 in `eimpath.svg` viewBox (path starts here). */
export const EIM_TOUCH2_ORIGIN = { x: 182, y: 132 }

export function splitPathSubpaths(d: string): string[] {
  return d
    .split(/(?=M)/)
    .map((segment) => segment.trim())
    .filter(Boolean)
}

export const EIM_PATH_VIEWBOX = { width: 379, height: 374 } as const

export function subpathStartPoint(subpath: string): { x: number; y: number } | null {
  const match = subpath.match(/^M([-\d.]+)[,\s]+([-\d.]+)/)
  if (!match) return null
  return {
    x: Number.parseFloat(match[1]),
    y: Number.parseFloat(match[2]),
  }
}

/**
 * Dashes in `eimpath.svg` are stored in reveal order (1→70 along the connector).
 * Splitting the orange path preserves that order for animation and debug labels.
 */
export function sortSubpathsByRevealOrder(segments: string[]): string[] {
  return segments
}

export function isEimDashDebugEnabled(): boolean {
  if (typeof window === 'undefined') return false
  return new URLSearchParams(window.location.search).get('eimDashDebug') === '1'
}
