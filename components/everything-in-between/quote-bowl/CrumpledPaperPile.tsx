'use client'

import type { QuoteBowlStep } from '@/lib/everything-in-between/quoteBowl/types'
import { QUOTE_BOWL } from '@/lib/everything-in-between/quoteBowl/constants'
import type { PaperSimBall } from '@/lib/everything-in-between/quoteBowl/paperPilePhysics'
import { usePaperPilePhysics } from '@/lib/everything-in-between/quoteBowl/usePaperPilePhysics'
import { usePilePaperMaterial } from '@/lib/everything-in-between/quoteBowl/usePilePaperMaterial'
import type { QuoteSlipLayout } from '@/lib/everything-in-between/quotePaper'
import { usePaperCrumpledModel } from '@/lib/everything-in-between/usePaperCrumpledModel'
import { useFrame, useThree } from '@react-three/fiber'
import { type MutableRefObject, type RefObject, useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'

type Vec3 = { x: number; y: number; z: number }

type Props = {
  layouts: readonly QuoteSlipLayout[]
  step: QuoteBowlStep
  selectedSlipId: number | null
  pullStartedAt: number | null
  resetStartedAt: number | null
  dimmed: boolean
  darkSurface: boolean
  reducedMotion: boolean
  bowlRotationRef: RefObject<THREE.Object3D | null>
  bowlTopY: number
  innerRadius: number
  pileBottomY: number
  pileTopY: number
  paperRadius: number
  paperRestOffsetY: number
  ballPickable: boolean
  onBallPick?: (layout: QuoteSlipLayout) => void
  onHoverBallChange?: (hovering: boolean) => void
  liveBallsRef?: MutableRefObject<PaperSimBall[]>
  pullStartCaptureRef?: MutableRefObject<Vec3 | null>
}

function easeOutCubic(t: number): number {
  const x = Math.max(0, Math.min(1, t))
  return 1 - Math.pow(1 - x, 3)
}

function phaseProgress(startedAt: number | null, durationMs: number): number {
  if (startedAt == null) return 0
  return easeOutCubic(
    Math.min(1, (performance.now() - startedAt) / durationMs),
  )
}

export function bowlRimTarget(
  bowlTopY: number,
  paperRadius: number,
  innerRadius: number,
): Vec3 {
  return {
    x: 0,
    y: bowlTopY - paperRadius * QUOTE_BOWL.pull.rimLift,
    z: innerRadius * QUOTE_BOWL.pull.rimZFactor,
  }
}

export function CrumpledPaperPile({
  layouts,
  step,
  selectedSlipId,
  pullStartedAt,
  resetStartedAt,
  dimmed,
  darkSurface,
  reducedMotion,
  bowlRotationRef,
  bowlTopY,
  innerRadius,
  pileBottomY,
  pileTopY,
  paperRadius,
  paperRestOffsetY,
  ballPickable,
  onBallPick,
  onHoverBallChange,
  liveBallsRef,
  pullStartCaptureRef,
}: Props) {
  const { geometry, material } = usePaperCrumpledModel()
  usePilePaperMaterial(material)

  const meshRef = useRef<THREE.InstancedMesh>(null)
  const dummy = useMemo(() => new THREE.Object3D(), [])
  const pullStartRef = useRef<Map<number, Vec3>>(new Map())
  const [hoveredId, setHoveredId] = useState<number | null>(null)
  const invalidate = useThree((s) => s.invalidate)
  const rim = useMemo(
    () => bowlRimTarget(bowlTopY, paperRadius, innerRadius),
    [bowlTopY, innerRadius, paperRadius],
  )
  const physicsActive =
    (step === 'pick' || step === 'resetting') && !reducedMotion

  const bounds = useMemo(
    () => ({
      innerRadius,
      pileBottomY,
      pileTopY,
      paperRadius,
      paperRestOffsetY,
    }),
    [innerRadius, pileBottomY, pileTopY, paperRadius, paperRestOffsetY],
  )

  const ballsRef = usePaperPilePhysics({
    layouts,
    bounds,
    bowlRotationRef,
    physicsActive,
    reducedMotion,
    selectedSlipId,
    step,
    resetStartedAt,
    rimDrop: rim,
  })

  useEffect(() => {
    if (step === 'pick') {
      pullStartRef.current.clear()
    }
  }, [step])

  useEffect(() => {
    if (dimmed) {
      material.opacity = QUOTE_BOWL.paper.pileDimOpacity
      material.transparent = true
    } else {
      material.opacity = 1
      material.transparent = false
      material.depthWrite = true
    }
    material.needsUpdate = true
  }, [material, dimmed])

  useEffect(() => {
    if (!ballPickable) {
      setHoveredId(null)
      onHoverBallChange?.(false)
    }
  }, [ballPickable, onHoverBallChange])

  useFrame(() => {
    const mesh = meshRef.current
    const balls = ballsRef.current
    if (liveBallsRef) {
      liveBallsRef.current = balls
    }
    if (!mesh || balls.length === 0) return

    const pullT = phaseProgress(pullStartedAt, QUOTE_BOWL.pull.durationMs)
    const hoverScale = QUOTE_BOWL.pull.ballHoverScale

    balls.forEach((ball, index) => {
      const isSelected = selectedSlipId === ball.layout.id
      const isHovered = ballPickable && hoveredId === ball.layout.id
      const [rx, ry, rz] = ball.layout.rotation
      const [sx, sy, sz] = ball.layout.stretch
      const speed = Math.hypot(ball.vx, ball.vy, ball.vz)
      const tumble =
        step === 'pick' && physicsActive && speed > 0.012 ? Math.min(speed * 0.35, 0.1) : 0
      const pullScale = step === 'pulling' && isSelected ? 1 + pullT * 0.08 : 1
      const hoverMul = isHovered ? hoverScale : 1
      const baseScale = ball.layout.scale * pullScale * hoverMul

      if (step === 'pulling' && isSelected && pullStartedAt != null) {
        if (!pullStartRef.current.has(ball.layout.id)) {
          const start = { x: ball.x, y: ball.y, z: ball.z }
          pullStartRef.current.set(ball.layout.id, start)
          if (pullStartCaptureRef) {
            pullStartCaptureRef.current = start
          }
        }
        const start = pullStartRef.current.get(ball.layout.id)!
        ball.x = THREE.MathUtils.lerp(start.x, rim.x, pullT)
        ball.y = THREE.MathUtils.lerp(start.y, rim.y, pullT)
        ball.z = THREE.MathUtils.lerp(start.z, rim.z, pullT)
        dummy.position.set(ball.x, ball.y, ball.z)
      } else if (isSelected && step === 'revealed') {
        dummy.position.set(0, -999, 0)
        dummy.rotation.set(0, 0, 0)
        dummy.scale.setScalar(0.0001)
        dummy.updateMatrix()
        mesh.setMatrixAt(index, dummy.matrix)
        return
      } else {
        dummy.position.set(ball.x, ball.y, ball.z)
      }

      dummy.rotation.set(
        rx + ball.vz * tumble,
        ry + ball.vx * tumble * 0.25,
        rz - ball.vx * tumble,
      )
      dummy.scale.set(baseScale * sx, baseScale * sy, baseScale * sz)
      dummy.updateMatrix()
      mesh.setMatrixAt(index, dummy.matrix)
    })
    mesh.instanceMatrix.needsUpdate = true
  })

  return (
    <instancedMesh
      ref={meshRef}
      args={[geometry, material, layouts.length]}
      castShadow
      receiveShadow
      renderOrder={4}
      frustumCulled={false}
      onPointerOver={
        ballPickable
          ? (event) => {
              event.stopPropagation()
              const id = event.instanceId
              if (id == null) return
              setHoveredId(layouts[id]?.id ?? null)
              onHoverBallChange?.(true)
              document.body.style.cursor = 'pointer'
              invalidate()
            }
          : undefined
      }
      onPointerOut={
        ballPickable
          ? (event) => {
              event.stopPropagation()
              setHoveredId(null)
              onHoverBallChange?.(false)
              document.body.style.cursor = ''
              invalidate()
            }
          : undefined
      }
      onPointerDown={
        ballPickable
          ? (event) => {
              event.stopPropagation()
              const id = event.instanceId
              if (id == null || !onBallPick) return
              const layout = layouts[id]
              if (!layout) return
              if (event.pointerType === 'touch' || event.pointerType === 'pen') {
                onBallPick(layout)
              }
            }
          : undefined
      }
      onClick={
        ballPickable
          ? (event) => {
              event.stopPropagation()
              const native = event.nativeEvent
              if (
                native instanceof PointerEvent &&
                (native.pointerType === 'touch' || native.pointerType === 'pen')
              ) {
                return
              }
              const id = event.instanceId
              if (id == null || !onBallPick) return
              const layout = layouts[id]
              if (layout) onBallPick(layout)
            }
          : undefined
      }
    />
  )
}
