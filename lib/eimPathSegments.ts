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

export function subpathDistanceFrom(
  subpath: string,
  origin: { x: number; y: number },
): number {
  const start = subpathStartPoint(subpath)
  if (!start) return Number.POSITIVE_INFINITY
  return Math.hypot(start.x - origin.x, start.y - origin.y)
}

/** Distance-sorted IDs from the original debug map (`?eimDashDebug=1`). */
export function sortSubpathsByLegacyId(
  segments: string[],
  origin = EIM_TOUCH2_ORIGIN,
): string[] {
  return [...segments].sort(
    (a, b) => subpathDistanceFrom(a, origin) - subpathDistanceFrom(b, origin),
  )
}

/**
 * Reveal order for the EIM connector dashes (Touch 2 → EIM).
 * Values are legacy debug segment IDs (1–70) from `sortSubpathsByLegacyId`.
 */
export const EIM_DASH_REVEAL_ORDER: readonly number[] = [
  36, 40, 47, 54, 58, 60, 61, 59, 57, 51, 44, 31, 25, 27, 32, 35, 41, 39, 33,
  24, 18, 13, 8, 4, 1, 2, 5, 9, 12, 16, 20, 26, 30, 38, 43, 45, 49, 52, 53,
  50, 48, 42, 34, 28, 22, 15, 11, 7, 3, 6, 10, 14, 17, 19, 21, 23, 29, 37,
  46, 56, 63, 64, 66, 69, 70, 68, 67, 65, 62, 55,
] as const

/** Segments ordered for animation and debug labels 1→70. */
export function sortSubpathsByRevealOrder(segments: string[]): string[] {
  const byLegacyId = sortSubpathsByLegacyId(segments)
  return EIM_DASH_REVEAL_ORDER.map((legacyId) => byLegacyId[legacyId - 1])
}

/** @deprecated Use {@link sortSubpathsByRevealOrder} */
export const sortSubpathsFromTouch2 = sortSubpathsByRevealOrder

export function isEimDashDebugEnabled(): boolean {
  if (typeof window === 'undefined') return false
  return new URLSearchParams(window.location.search).get('eimDashDebug') === '1'
}
