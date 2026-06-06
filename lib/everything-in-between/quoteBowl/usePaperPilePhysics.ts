'use client'

import { QUOTE_BOWL } from '@/lib/everything-in-between/quoteBowl/constants'
import {
  clampPaperSimBall,
  createPaperSimBall,
  type PaperSimBall,
  stepPaperPilePhysics,
} from '@/lib/everything-in-between/quoteBowl/paperPilePhysics'
import type { QuoteSlipLayout } from '@/lib/everything-in-between/quotePaper'
import { useFrame, useThree } from '@react-three/fiber'
import { type RefObject, useEffect, useRef } from 'react'
import * as THREE from 'three'

type BowlBounds = {
  innerRadius: number
  pileBottomY: number
  pileTopY: number
  paperRadius: number
  paperRestOffsetY: number
}

type Options = {
  layouts: readonly QuoteSlipLayout[]
  bounds: BowlBounds
  bowlRotationRef: RefObject<THREE.Object3D | null>
  physicsActive: boolean
  reducedMotion: boolean
  selectedSlipId: number | null
  step: 'pick' | 'revealed'
}

const gravityWorld = new THREE.Vector3(0, -1, 0)
const gravityTarget = new THREE.Vector3()
const gravityLocal = new THREE.Vector3()
const bowlQuat = new THREE.Quaternion()

export function usePaperPilePhysics({
  layouts,
  bounds,
  bowlRotationRef,
  physicsActive,
  reducedMotion,
  selectedSlipId,
  step,
}: Options) {
  const ballsRef = useRef<PaperSimBall[]>([])
  const layoutKeyRef = useRef('')
  const frozenRef = useRef(false)
  const gravityReadyRef = useRef(false)
  const invalidate = useThree((s) => s.invalidate)

  useEffect(() => {
    const layoutKey = layouts.map((l) => `${l.id}:${l.position.join(',')}`).join('|')
    if (layoutKey === layoutKeyRef.current) return
    layoutKeyRef.current = layoutKey

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
        ball.vy = -0.35 - Math.random() * 0.15
        ball.vx = (Math.random() - 0.5) * 0.02
        ball.vz = (Math.random() - 0.5) * 0.02
      }
      return ball
    })
    frozenRef.current = false
    gravityReadyRef.current = false
    invalidate()
  }, [layouts, bounds, reducedMotion, invalidate])

  useEffect(() => {
    frozenRef.current = step !== 'pick'
    if (step === 'pick' && physicsActive) {
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

  useFrame((_, delta) => {
    const balls = ballsRef.current
    if (balls.length === 0) return

    const frameDt = Math.min(delta, 1 / 30)
    const { subSteps, gravitySmoothing } = QUOTE_BOWL.paper.physics
    const subDt = frameDt / subSteps

    if (physicsActive && !frozenRef.current) {
      const root = bowlRotationRef.current
      if (root) {
        root.getWorldQuaternion(bowlQuat)
        gravityTarget.copy(gravityWorld).applyQuaternion(bowlQuat.invert())
      } else {
        gravityTarget.set(0, -1, 0)
      }

      if (!gravityReadyRef.current) {
        gravityLocal.copy(gravityTarget)
        gravityReadyRef.current = true
      } else {
        gravityLocal.lerp(gravityTarget, gravitySmoothing)
      }
      gravityLocal.normalize()

      for (let i = 0; i < subSteps; i += 1) {
        stepPaperPilePhysics(balls, {
          gravityX: gravityLocal.x,
          gravityY: gravityLocal.y,
          gravityZ: gravityLocal.z,
          delta: subDt,
        })
      }
    }

    if (!physicsActive || frozenRef.current) {
      for (const ball of balls) {
        if (selectedSlipId === ball.layout.id && step !== 'pick') {
          continue
        }
        clampPaperSimBall(ball)
      }
    }
  })

  return ballsRef
}
