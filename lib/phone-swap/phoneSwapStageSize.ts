/** View box scale — 1 = full design size, ~0.68 = default on site. */
export const DEFAULT_PHONE_STAGE_SIZE = 0.68
export const DEFAULT_PHONE_STAGE_WIDTH = DEFAULT_PHONE_STAGE_SIZE
export const PHONE_STAGE_SIZE_MIN = 0.42
export const PHONE_STAGE_SIZE_MAX = 1.05

export function clampStageSize(value: number): number {
  if (!Number.isFinite(value)) return DEFAULT_PHONE_STAGE_SIZE
  return Math.max(
    PHONE_STAGE_SIZE_MIN,
    Math.min(PHONE_STAGE_SIZE_MAX, value),
  )
}

export function clampStageWidth(value: number): number {
  return clampStageSize(value)
}

export function stageSizePercent(size: number): number {
  return Math.round(clampStageSize(size) * 100)
}

export function stageWidthPercent(width: number): number {
  return Math.round(clampStageWidth(width) * 100)
}
