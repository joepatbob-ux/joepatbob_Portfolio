import * as THREE from 'three'

/** Bowl interior radius at a given height — used for pile layout and settling. */
export function bowlRadiusAtY(
  y: number,
  innerRadius: number,
  bottomY: number,
  topY: number,
): number {
  const height = Math.max(topY - bottomY, 0.01)
  const t = THREE.MathUtils.clamp((y - bottomY) / height, 0, 1)
  const rimR = innerRadius * 0.92
  const bellyR = innerRadius * 0.98
  const bottomR = innerRadius * 0.38

  if (t < 0.14) return THREE.MathUtils.lerp(bottomR, bellyR * 0.68, t / 0.14)
  if (t < 0.52) return THREE.MathUtils.lerp(bellyR * 0.68, bellyR, (t - 0.14) / 0.38)
  return THREE.MathUtils.lerp(bellyR, rimR, (t - 0.52) / 0.48)
}

export type BowlBallBounds = {
  innerRadius: number
  pileBottomY: number
  pileTopY: number
  paperRadius: number
  restOffsetY: number
}

/** Max horizontal distance from bowl center for a ball center at `centerY`. */
export function maxCenterRadiusAtY(
  centerY: number,
  bounds: BowlBallBounds,
): number {
  const bottomY = centerY - bounds.restOffsetY
  const wallR = bowlRadiusAtY(
    bottomY,
    bounds.innerRadius,
    bounds.pileBottomY,
    bounds.pileTopY,
  )
  return Math.max(wallR * 0.58 - bounds.paperRadius * 0.55, bounds.innerRadius * 0.05)
}

/** Keep a crumpled slip center inside the visible glass cavity. */
export function clampBallCenterToBowl(
  x: number,
  y: number,
  z: number,
  bounds: BowlBallBounds,
): [number, number, number] {
  const minY = bounds.pileBottomY + bounds.restOffsetY
  const maxY = bounds.pileTopY - bounds.restOffsetY * 0.35
  const cy = THREE.MathUtils.clamp(y, minY, maxY)
  const maxR = maxCenterRadiusAtY(cy, bounds)
  const dist = Math.hypot(x, z)
  if (dist > maxR && dist > 0) {
    const scale = maxR / dist
    return [x * scale, cy, z * scale]
  }
  return [x, cy, z]
}

/** Random point inside the bowl volume for drop spawns. */
export function randomPointInsideBowl(
  rand: () => number,
  bounds: BowlBallBounds,
  band: 'upper' | 'any' = 'any',
): [number, number, number] {
  const fillHeight = Math.max(bounds.pileTopY - bounds.pileBottomY, 0.01)
  const heightT =
    band === 'upper' ? 0.48 + rand() * 0.36 : 0.22 + rand() * 0.58
  const y =
    bounds.pileBottomY +
    bounds.restOffsetY +
    fillHeight * heightT
  const maxR = maxCenterRadiusAtY(y, bounds) * (0.08 + rand() * 0.92)
  const angle = rand() * Math.PI * 2
  return [Math.cos(angle) * maxR, y, Math.sin(angle) * maxR]
}
