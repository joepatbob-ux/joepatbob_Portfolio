/** Total swap duration (ms) — keep in sync with PhoneSwap timeout. */
export const PHONE_SWAP_ANIM_MS = 2400

export function easeInOutSine(t: number): number {
  return -(Math.cos(Math.PI * Math.max(0, Math.min(1, t))) - 1) / 2
}
