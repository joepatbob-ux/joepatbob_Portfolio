import { boardScale } from '@/lib/formation/legoGrid'

export type SpritePlacement = {
  left: number
  top: number
  width: number
  height: number
}

type NativePoint = { x: number; y: number }

/** Position overlay/brick so anchor in SVG sits on target in board native space. */
export function spritePlacement(
  displayWidth: number,
  anchor: NativePoint,
  target: NativePoint,
  viewBox: { width: number; height: number },
  level = 0,
  layerLift = 0,
): SpritePlacement {
  const s = boardScale(displayWidth)
  return {
    left: (target.x - anchor.x) * s,
    top: (target.y - anchor.y) * s - level * layerLift,
    width: viewBox.width * s,
    height: viewBox.height * s,
  }
}
