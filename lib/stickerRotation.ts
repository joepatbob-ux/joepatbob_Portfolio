/** Maps pointer atan2 (0° = east) to sticker rotation (0° = dot at top). */
export const POINTER_TO_STICKER_ROTATION = 90

export function pointerAngleDeg(
  cx: number,
  cy: number,
  px: number,
  py: number,
): number {
  return (Math.atan2(py - cy, px - cx) * 180) / Math.PI
}

export function stickerRotationFromPointer(
  cx: number,
  cy: number,
  px: number,
  py: number,
): number {
  return pointerAngleDeg(cx, cy, px, py) + POINTER_TO_STICKER_ROTATION
}

/** Shortest signed delta between two pointer angles (degrees). */
export function shortestAngleDeltaDeg(from: number, to: number): number {
  let delta = to - from
  if (delta > 180) delta -= 360
  if (delta < -180) delta += 360
  return delta
}

export function roundStickerRotation(deg: number): number {
  return Math.round(deg * 10) / 10
}
