import {
  clampBallCenterToBowl,
  type BowlBallBounds,
} from '@/lib/everything-in-between/quoteBowl/bowlGeometry'
import { QUOTE_BOWL } from '@/lib/everything-in-between/quoteBowl/constants'
import type { QuoteSlipLayout } from '@/lib/everything-in-between/quotePaper'

export type PaperSimBall = {
  layout: QuoteSlipLayout
  x: number
  y: number
  z: number
  vx: number
  vy: number
  vz: number
  bounds: BowlBallBounds
}

export function createPaperSimBall(
  layout: QuoteSlipLayout,
  innerRadius: number,
  pileBottomY: number,
  pileTopY: number,
  paperRadius: number,
  paperRestOffsetY: number,
  useSpawn = true,
): PaperSimBall {
  const [x, y, z] = useSpawn
    ? (layout.spawnPosition ?? layout.position)
    : layout.position
  const bounds: BowlBallBounds = {
    innerRadius,
    pileBottomY,
    pileTopY,
    paperRadius: paperRadius * layout.scale,
    restOffsetY: paperRestOffsetY * layout.scale,
  }
  const ball: PaperSimBall = { layout, x, y, z, vx: 0, vy: 0, vz: 0, bounds }
  clampPaperSimBall(ball)
  return ball
}

export function clampPaperSimBall(ball: PaperSimBall) {
  ;[ball.x, ball.y, ball.z] = clampBallCenterToBowl(
    ball.x,
    ball.y,
    ball.z,
    ball.bounds,
  )
}

function ballMass(ball: PaperSimBall): number {
  const r = ball.bounds.paperRadius
  return r * r * r
}

function collisionNormal(
  dx: number,
  dy: number,
  dz: number,
  dist: number,
): [number, number, number] {
  if (dist > 1e-6) {
    return [dx / dist, dy / dist, dz / dist]
  }
  return [0, 1, 0]
}

function isOnFloor(ball: PaperSimBall): boolean {
  const minY = ball.bounds.pileBottomY + ball.bounds.restOffsetY
  return ball.y <= minY + 0.002
}

/** 3D sphere contacts — separate positions and deflect velocities along the collision normal. */
export function resolvePaperBallCollisions(
  balls: PaperSimBall[],
  separation = QUOTE_BOWL.paper.ballSeparation,
) {
  const { collisionRestitution, collisionCorrection } = QUOTE_BOWL.paper.physics

  for (let i = 0; i < balls.length; i += 1) {
    for (let j = i + 1; j < balls.length; j += 1) {
      const a = balls[i]
      const b = balls[j]
      const dx = b.x - a.x
      const dy = b.y - a.y
      const dz = b.z - a.z
      const dist = Math.hypot(dx, dy, dz)
      const minDist = (a.bounds.paperRadius + b.bounds.paperRadius) * separation
      if (dist >= minDist) continue

      const [nx, ny, nz] = collisionNormal(dx, dy, dz, dist)
      const overlap = (minDist - dist) * collisionCorrection
      const massA = ballMass(a)
      const massB = ballMass(b)
      const totalMass = massA + massB
      const moveA = overlap * (massB / totalMass)
      const moveB = overlap * (massA / totalMass)

      if (isOnFloor(a)) {
        a.x -= nx * moveA
        a.z -= nz * moveA
        if (ny < 0) a.y -= ny * moveA
      } else {
        a.x -= nx * moveA
        a.y -= ny * moveA
        a.z -= nz * moveA
      }

      if (isOnFloor(b)) {
        b.x += nx * moveB
        b.z += nz * moveB
        if (ny > 0) b.y += ny * moveB
      } else {
        b.x += nx * moveB
        b.y += ny * moveB
        b.z += nz * moveB
      }

      const rvx = b.vx - a.vx
      const rvy = b.vy - a.vy
      const rvz = b.vz - a.vz
      const velAlongNormal = rvx * nx + rvy * ny + rvz * nz
      if (velAlongNormal >= 0) continue

      const invMassA = 1 / massA
      const invMassB = 1 / massB
      const impulse =
        (-(1 + collisionRestitution) * velAlongNormal) / (invMassA + invMassB)

      a.vx -= impulse * invMassA * nx
      a.vy -= impulse * invMassA * ny
      a.vz -= impulse * invMassA * nz
      b.vx += impulse * invMassB * nx
      b.vy += impulse * invMassB * ny
      b.vz += impulse * invMassB * nz

      if (isOnFloor(a)) {
        a.vy = 0
      }
      if (isOnFloor(b)) {
        b.vy = 0
      }
    }
  }
}

function applyDrag(ball: PaperSimBall, onFloor: boolean, gravityY: number) {
  const { airDamping, floorFriction } = QUOTE_BOWL.paper.physics
  if (onFloor) {
    ball.vx *= floorFriction
    ball.vz *= floorFriction
    ball.vy = 0
    return
  }
  ball.vx *= airDamping
  ball.vz *= airDamping
  if (ball.vy * gravityY < 0) {
    ball.vy *= airDamping
  }
}

function clampVelocity(ball: PaperSimBall, maxSpeed: number, sleepSpeed: number) {
  const speed = Math.hypot(ball.vx, ball.vy, ball.vz)
  if (speed > maxSpeed) {
    const scale = maxSpeed / speed
    ball.vx *= scale
    ball.vy *= scale
    ball.vz *= scale
    return
  }
  if (speed < sleepSpeed) {
    ball.vx = 0
    ball.vy = 0
    ball.vz = 0
  }
}

type StepOptions = {
  gravityX: number
  gravityY: number
  gravityZ: number
  delta: number
}

/** Integrate one frame — gravity follows bowl tilt via `gravity*` in bowl space. */
export function stepPaperPilePhysics(
  balls: PaperSimBall[],
  options: StepOptions,
) {
  const { gravityX, gravityY, gravityZ, delta } = options
  const { gravityStrength, floorBounce, maxSpeed, sleepSpeed, collisionPasses } =
    QUOTE_BOWL.paper.physics

  const gx = gravityX * gravityStrength
  const gy = gravityY * gravityStrength
  const gz = gravityZ * gravityStrength

  for (const ball of balls) {
    ball.vx += gx * delta
    ball.vy += gy * delta
    ball.vz += gz * delta

    ball.x += ball.vx * delta
    ball.y += ball.vy * delta
    ball.z += ball.vz * delta

    const minY = ball.bounds.pileBottomY + ball.bounds.restOffsetY
    const hitFloor = ball.y < minY
    if (hitFloor) {
      ball.y = minY
      if (ball.vy < 0) {
        ball.vy = Math.abs(ball.vy) * floorBounce
      }
    }

    applyDrag(ball, hitFloor || ball.y <= minY + 0.001, gy)
    clampPaperSimBall(ball)
    clampVelocity(ball, maxSpeed, sleepSpeed)
  }

  for (let pass = 0; pass < collisionPasses; pass += 1) {
    resolvePaperBallCollisions(balls)
    for (const ball of balls) {
      const minY = ball.bounds.pileBottomY + ball.bounds.restOffsetY
      if (ball.y < minY) {
        ball.y = minY
        if (ball.vy < 0) ball.vy = 0
      }
      clampPaperSimBall(ball)
    }
  }
}
