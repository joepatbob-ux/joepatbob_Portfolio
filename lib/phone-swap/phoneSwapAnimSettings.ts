/** Runtime-tunable swap animation (dev panel). */

export type PhoneSwapAnimSettings = {
  /** Full swap duration in milliseconds. */
  durationMs: number
  /** Curve parameter where authored midpoint depth blend begins (0–1). */
  depthBlendStart: number
  /** Curve parameter where authored midpoint depth blend ends (0–1). */
  depthBlendEnd: number
}

export const PHONE_SWAP_ANIM_MS_MIN = 600
export const PHONE_SWAP_ANIM_MS_MAX = 4800

export const DEFAULT_PHONE_SWAP_ANIM: PhoneSwapAnimSettings = {
  durationMs: 900,
  depthBlendStart: 0.2,
  depthBlendEnd: 0.52,
}

export function clampAnimSettings(
  raw: Partial<PhoneSwapAnimSettings>,
): PhoneSwapAnimSettings {
  const durationMs = Number.isFinite(raw.durationMs)
    ? Math.max(
        PHONE_SWAP_ANIM_MS_MIN,
        Math.min(PHONE_SWAP_ANIM_MS_MAX, Math.round(raw.durationMs)),
      )
    : DEFAULT_PHONE_SWAP_ANIM.durationMs

  let depthBlendStart = Number.isFinite(raw.depthBlendStart)
    ? raw.depthBlendStart!
    : DEFAULT_PHONE_SWAP_ANIM.depthBlendStart
  let depthBlendEnd = Number.isFinite(raw.depthBlendEnd)
    ? raw.depthBlendEnd!
    : DEFAULT_PHONE_SWAP_ANIM.depthBlendEnd

  depthBlendStart = Math.max(0.2, Math.min(0.48, depthBlendStart))
  depthBlendEnd = Math.max(0.52, Math.min(0.8, depthBlendEnd))
  if (depthBlendEnd < depthBlendStart + 0.06) {
    depthBlendEnd = depthBlendStart + 0.06
  }

  return { durationMs, depthBlendStart, depthBlendEnd }
}

export function formatAnimSettingsTs(settings: PhoneSwapAnimSettings): string {
  const s = clampAnimSettings(settings)
  return `export const PHONE_SWAP_ANIM: PhoneSwapAnimSettings = {
  durationMs: ${s.durationMs},
  depthBlendStart: ${s.depthBlendStart.toFixed(2)},
  depthBlendEnd: ${s.depthBlendEnd.toFixed(2)},
}`
}
