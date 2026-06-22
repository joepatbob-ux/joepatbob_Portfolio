import { interpolate } from 'flubber'
import {
  COLLAPSED_INNER_PATH,
  INNER_SLOT_COUNT,
  PRELOADER_ICONS,
} from '@/lib/preloader/iconPaths'

export const MORPH_MS = 600
export const HOLD_MS = 250

export type MorphInterpolator = (t: number) => string

/** Precomputed flubber interpolators for frame paths between adjacent icons. */
export const FRAME_INTERPOLATORS: MorphInterpolator[] = PRELOADER_ICONS.map((icon, index) => {
  const next = PRELOADER_ICONS[(index + 1) % PRELOADER_ICONS.length]
  return interpolate(icon.frame, next.frame)
})

/** Precomputed flubber interpolators per inner slot between adjacent icons. */
export const INNER_INTERPOLATORS: MorphInterpolator[][] = PRELOADER_ICONS.map((icon, index) => {
  const next = PRELOADER_ICONS[(index + 1) % PRELOADER_ICONS.length]
  return Array.from({ length: INNER_SLOT_COUNT }, (_, slot) =>
    interpolate(icon.inners[slot], next.inners[slot]),
  )
})

export function easeInOut(t: number): number {
  return t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2
}

/** Segment length = morph + hold (one icon state). */
export const SEGMENT_MS = MORPH_MS + HOLD_MS
export const CYCLE_MS = SEGMENT_MS * PRELOADER_ICONS.length

export type MorphFrame = {
  frameD: string
  innerDs: string[]
  iconIndex: number
  label: string
  morphing: boolean
}

/** Sample morph state at absolute elapsed time (ms), looping. */
export function sampleMorphFrame(elapsedMs: number): MorphFrame {
  const loopMs = ((elapsedMs % CYCLE_MS) + CYCLE_MS) % CYCLE_MS
  const segmentIndex = Math.floor(loopMs / SEGMENT_MS)
  const segmentPhase = loopMs - segmentIndex * SEGMENT_MS
  const icon = PRELOADER_ICONS[segmentIndex]

  if (segmentPhase <= MORPH_MS) {
    const t = easeInOut(segmentPhase / MORPH_MS)
    return {
      frameD: FRAME_INTERPOLATORS[segmentIndex](t),
      innerDs: INNER_INTERPOLATORS[segmentIndex].map((fn) => fn(t)),
      iconIndex: segmentIndex,
      label: icon.label,
      morphing: true,
    }
  }

  return {
    frameD: icon.frame,
    innerDs: [...icon.inners],
    iconIndex: segmentIndex,
    label: icon.label,
    morphing: false,
  }
}

export function isCollapsedInner(path: string): boolean {
  return path === COLLAPSED_INNER_PATH
}
