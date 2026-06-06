import type { QuoteSlipLayout } from '@/lib/everything-in-between/quotePaper'
import {
  clampBallCenterToBowl,
  type BowlBallBounds,
} from '@/lib/everything-in-between/quoteBowl/bowlGeometry'
import { QUOTE_BOWL } from '@/lib/everything-in-between/quoteBowl/constants'
import * as THREE from 'three'

type SimBall = {
  layout: QuoteSlipLayout
  x: number
  y: number
  z: number
  vx: number
  vy: number
  vz: number
  bounds: BowlBallBounds
}

type SettleOptions = {
  innerRadius: number
  pileBottomY: number
  pileTopY: number
  paperRadius: number
  paperRestOffsetY: number
  steps?: number
  gravity?: number
  dt?: number
}

function ballBounds(
  layout: QuoteSlipLayout,
  options: SettleOptions,
): BowlBallBounds {
  return {
    innerRadius: options.innerRadius,
    pileBottomY: options.pileBottomY,
    pileTopY: options.pileTopY,
    paperRadius: options.paperRadius * layout.scale,
    restOffsetY: options.paperRestOffsetY * layout.scale,
  }
}

function clampBall(ball: SimBall) {
  ;[ball.x, ball.y, ball.z] = clampBallCenterToBowl(
    ball.x,
    ball.y,
    ball.z,
    ball.bounds,
  )
}

function separateBalls(balls: SimBall[], separation = QUOTE_BOWL.paper.ballSeparation) {
  for (let i = 0; i < balls.length; i += 1) {
    for (let j = i + 1; j < balls.length; j += 1) {
      const a = balls[i]
      const b = balls[j]
      const dx = b.x - a.x
      const dy = b.y - a.y
      const dz = b.z - a.z
      const dist = Math.hypot(dx, dy, dz)
      const minDist = (a.bounds.paperRadius + b.bounds.paperRadius) * separation
      if (dist >= minDist || dist < 0.0001) continue

      const push = (minDist - dist) * 0.52
      const nx = dx / dist
      const ny = dy / dist
      const nz = dz / dist
      a.x -= nx * push
      a.y -= ny * push * 0.32
      a.z -= nz * push
      b.x += nx * push
      b.y += ny * push * 0.32
      b.z += nz * push
    }
  }
}

function relaxBallSpacing(balls: SimBall[], passes = 4) {
  for (let pass = 0; pass < passes; pass += 1) {
    separateBalls(balls)
    for (const ball of balls) {
      clampBall(ball)
    }
  }
}

/** Drop crumpled slips with gravity until they rest on the bowl floor and each other. */
export function settlePaperPile(
  layouts: readonly QuoteSlipLayout[],
  options: SettleOptions,
): QuoteSlipLayout[] {
  const { steps = 240, gravity = -5.4, dt = 1 / 60 } = options

  const balls: SimBall[] = layouts.map((layout) => {
    const bounds = ballBounds(layout, options)
    const [x, y, z] = layout.spawnPosition ?? layout.position
    const ball: SimBall = {
      layout,
      x,
      y,
      z,
      vx: (Math.random() - 0.5) * 0.05,
      vy: -0.02 - Math.random() * 0.04,
      vz: (Math.random() - 0.5) * 0.05,
      bounds,
    }
    clampBall(ball)
    return ball
  })

  for (let step = 0; step < steps; step += 1) {
    for (const ball of balls) {
      ball.vy += gravity * dt
      ball.x += ball.vx
      ball.y += ball.vy
      ball.z += ball.vz

      ball.vx *= 0.986
      ball.vz *= 0.986

      const minY = ball.bounds.pileBottomY + ball.bounds.restOffsetY
      if (ball.y < minY) {
        ball.y = minY
        ball.vy = Math.abs(ball.vy) * 0.1
        if (Math.abs(ball.vy) < 0.003) ball.vy = 0
      }

      clampBall(ball)
    }

    separateBalls(balls)

    for (const ball of balls) {
      clampBall(ball)
    }
  }

  relaxBallSpacing(balls, 6)

  return balls.map((ball) => ({
    ...ball.layout,
    spawnPosition: ball.layout.spawnPosition ?? ball.layout.position,
    position: [ball.x, ball.y, ball.z],
  }))
}

export function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - THREE.MathUtils.clamp(t, 0, 1), 3)
}
