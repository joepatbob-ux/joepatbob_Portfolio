import { DEFAULT_PHONE_SWAP_ANIM } from '@/lib/phone-swap/phoneSwapAnimSettings'

/** Default swap duration (ms) — override at runtime via animation tune panel. */
export const PHONE_SWAP_ANIM_MS = DEFAULT_PHONE_SWAP_ANIM.durationMs

function clamp01(t: number): number {
  return Math.max(0, Math.min(1, t))
}

export function easeInOutSine(t: number): number {
  return -(Math.cos(Math.PI * clamp01(t)) - 1) / 2
}
