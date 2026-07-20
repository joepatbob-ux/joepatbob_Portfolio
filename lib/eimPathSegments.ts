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

export function isEimDashDebugEnabled(): boolean {
  if (typeof window === 'undefined') return false
  return new URLSearchParams(window.location.search).get('eimDashDebug') === '1'
}

/** On-screen timing tuner (sliders): `?eimTiming=1`. */
export function isEimTimingDebugEnabled(): boolean {
  if (typeof window === 'undefined') return false
  return new URLSearchParams(window.location.search).get('eimTiming') === '1'
}

/** Baseline dash-cascade timing. Tunable live via `?eimTiming=1`, and each
 * value can be seeded from the URL (`?eimDraw=`, `?eimHold=`, `?eimFade=`) so a
 * dialed-in setting is shareable as a link. */
export const EIM_TIMING_DEFAULTS = {
  /** Full-cascade sweep-on duration (ms) — larger = slower draw. */
  drawMs: 2200,
  /** Dwell at each end of the cycle before the next phase (ms). */
  holdMs: 0,
  /** Per-dash fade duration (ms). */
  fadeMs: 160,
} as const

export type EimTiming = { drawMs: number; holdMs: number; fadeMs: number }

export const EIM_TIMING_RANGE = {
  drawMs: { min: 200, max: 4000, step: 50 },
  holdMs: { min: 0, max: 3000, step: 50 },
  fadeMs: { min: 120, max: 1200, step: 20 },
} as const

function readTimingParam(
  param: string,
  key: keyof typeof EIM_TIMING_RANGE,
): number {
  const fallback = EIM_TIMING_DEFAULTS[key]
  if (typeof window === 'undefined') return fallback
  const raw = new URLSearchParams(window.location.search).get(param)
  if (raw == null) return fallback
  const n = Number(raw)
  if (!Number.isFinite(n)) return fallback
  // Clamp into the tuner's published range so a hand-edited URL can't set a
  // value the sliders forbid (e.g. ?eimFade=0 under fadeMs.min = 120).
  const { min, max } = EIM_TIMING_RANGE[key]
  return Math.min(max, Math.max(min, n))
}

/** Initial timing: URL-seeded where present, else the defaults. */
export function readEimTiming(): EimTiming {
  return {
    drawMs: readTimingParam('eimDraw', 'drawMs'),
    holdMs: readTimingParam('eimHold', 'holdMs'),
    fadeMs: readTimingParam('eimFade', 'fadeMs'),
  }
}
