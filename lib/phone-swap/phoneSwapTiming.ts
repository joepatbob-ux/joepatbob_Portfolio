/** Total swap duration (ms) — keep in sync with PhoneSwapScene animation. */
export const PHONE_SWAP_ANIM_MS = 3200

function clamp01(t: number): number {
  return Math.max(0, Math.min(1, t))
}

/** Gentle ease for overall swap progress (single application on the timeline). */
export function easeInOutQuint(t: number): number {
  const x = clamp01(t)
  return x < 0.5 ? 16 * x ** 5 : 1 - (-2 * x + 2) ** 5 / 2
}

export function easeInOutSine(t: number): number {
  return -(Math.cos(Math.PI * clamp01(t)) - 1) / 2
}
