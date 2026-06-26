'use client'

import { QUOTE_BOWL } from '@/lib/everything-in-between/quoteBowl/constants'
import {
  clampPaperSimBall,
  createPaperSimBall,
  type PaperSimBall,
  stepPaperPilePhysics,
} from '@/lib/everything-in-between/quoteBowl/paperPilePhysics'
import type { QuoteBowlStep } from '@/lib/everything-in-between/quoteBowl/types'
import type { QuoteSlipLayout } from '@/lib/everything-in-between/quotePaper'
import { useFrame, useThree } from '@react-three/fiber'
import { type RefObject, useEffect, useRef } from 'react'
import type * as THREE from 'three'

type BowlBounds = {
  innerRadius: number
  pileBottomY: number
  pileTopY: number
  paperRadius: number
  paperRestOffsetY: number
}

type RimPoint = { x: number; y: number; z: number }

type Options = {
  layouts: readonly QuoteSlipLayout[]
  bounds: BowlBounds
  bowlRotationRef: RefObject<THREE.Object3D | null>
  physicsActive: boolean
  reducedMotion: boolean
  selectedSlipId: number | null
  step: QuoteBowlStep
  resetStartedAt: number | null
  rimDrop: RimPoint | null
}

function restFloorY(ball: PaperSimBall): number {
  return ball.bounds.pileBottomY + ball.bounds.restOffsetY
}

function seedDropVelocity(ball: PaperSimBall, fromRim = false) {
  if (fromRim) {
    ball.vx = (Math.random() - 0.5) * 0.03
    ball.vy = -0.28 - Math.random() * 0.1
    ball.vz = (Math.random() - 0.5) * 0.03
    return
  }

  const floorY = restFloorY(ball)
  const dropHeight = ball.y - floorY
  if (dropHeight > 0.04) {
    ball.vy = -Math.min(0.55, 0.22 + dropHeight * 1.8)
    ball.vx = (Math.random() - 0.5) * 0.015
    ball.vz = (Math.random() - 0.5) * 0.015
    return
  }

  ball.vx = 0
  ball.vy = 0
  ball.vz = 0
}

export function usePaperPilePhysics({
  layouts,
  bounds,
  bowlRotationRef: _bowlRotationRef,
  physicsActive,
  reducedMotion,
  selectedSlipId,
  step,
  resetStartedAt,
  rimDrop,
}: Options) {
  const ballsRef = useRef<PaperSimBall[]>([])
  const layoutKeyRef = useRef('')
  const frozenRef = useRef(false)
  const resetDropKeyRef = useRef<string | null>(null)
  const invalidate = useThree((s) => s.invalidate)

  useEffect(() => {
    const layoutKey = layouts.map((l) => `${l.id}:${l.position.join(',')}`).join('|')
    if (layoutKey === layoutKeyRef.current) return
    layoutKeyRef.current = layoutKey
    resetDropKeyRef.current = null

    ballsRef.current = layouts.map((layout) => {
      const ball = createPaperSimBall(
        layout,
        bounds.innerRadius,
        bounds.pileBottomY,
        bounds.pileTopY,
        bounds.paperRadius,
        bounds.paperRestOffsetY,
        !reducedMotion,
      )
      if (!reducedMotion) {
        seedDropVelocity(ball)
      }
      return ball
    })
    frozenRef.current = false
    invalidate()
  }, [layouts, bounds, reducedMotion, invalidate])

  useEffect(() => {
    frozenRef.current = step !== 'pick' && step !== 'resetting'
    if ((step === 'pick' || step === 'resetting') && physicsActive) {
      invalidate()
    }
  }, [step, physicsActive, invalidate])

  useEffect(() => {
    if (selectedSlipId == null || step !== 'pick') return
    const balls = ballsRef.current
    const layout = layouts.find((l) => l.id === selectedSlipId)
    if (!layout) return
    const index = balls.findIndex((b) => b.layout.id === selectedSlipId)
    if (index < 0) return
    balls[index] = createPaperSimBall(
      layout,
      bounds.innerRadius,
      bounds.pileBottomY,
      bounds.pileTopY,
      bounds.paperRadius,
      bounds.paperRestOffsetY,
      false,
    )
  }, [selectedSlipId, layouts, bounds, step])

  useEffect(() => {
    if (
      step !== 'resetting' ||
      resetStartedAt == null ||
      selectedSlipId == null ||
      rimDrop == null
    ) {
      return
    }
    const dropKey = `${resetStartedAt}:${selectedSlipId}`
    if (resetDropKeyRef.current === dropKey) return
    resetDropKeyRef.current = dropKey

    const ball = ballsRef.current.find((b) => b.layout.id === selectedSlipId)
    if (!ball) return

    ball.x = rimDrop.x
    ball.y = rimDrop.y + bounds.paperRadius * 0.22
    ball.z = rimDrop.z
    seedDropVelocity(ball, true)
    invalidate()
  }, [bounds.paperRadius, invalidate, resetStartedAt, rimDrop, selectedSlipId, step])

  useFrame((_, delta) => {
    const balls = ballsRef.current
    if (balls.length === 0) return

    const frameDt = Math.min(delta, 1 / 30)
    const { subSteps } = QUOTE_BOWL.paper.physics
    const subDt = frameDt / subSteps

    if (physicsActive && !frozenRef.current) {
      const gravityX = 0
      const gravityY = -1
      const gravityZ = 0

      for (let i = 0; i < subSteps; i += 1) {
        stepPaperPilePhysics(balls, {
          gravityX,
          gravityY,
          gravityZ,
          delta: subDt,
        })
      }
    }

    if (!physicsActive || frozenRef.current) {
      for (const ball of balls) {
        if (selectedSlipId === ball.layout.id && step !== 'pick' && step !== 'resetting') {
          continue
        }
        clampPaperSimBall(ball)
      }
    }
  })

  return ballsRef
}
