'use client'

import type { QuoteBowlStep } from '@/lib/everything-in-between/quoteBowl/types'
import { QUOTE_BOWL } from '@/lib/everything-in-between/quoteBowl/constants'
import type { PaperSimBall } from '@/lib/everything-in-between/quoteBowl/paperPilePhysics'
import { usePaperPilePhysics } from '@/lib/everything-in-between/quoteBowl/usePaperPilePhysics'
import { useQuoteBowlPaperMaps } from '@/lib/everything-in-between/quoteBowl/useQuoteBowlPaperMaps'
import type { QuoteSlipLayout } from '@/lib/everything-in-between/quotePaper'
import { usePaperCrumpledModel } from '@/lib/everything-in-between/usePaperCrumpledModel'
import { useFrame } from '@react-three/fiber'
import { type MutableRefObject, type RefObject, useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'

type Props = {
  layouts: readonly QuoteSlipLayout[]
  step: QuoteBowlStep
  selectedSlipId: number | null
  dimmed: boolean
  darkSurface: boolean
  reducedMotion: boolean
  bowlRotationRef: RefObject<THREE.Object3D | null>
  innerRadius: number
  pileBottomY: number
  pileTopY: number
  paperRadius: number
  paperRestOffsetY: number
  liveBallsRef?: MutableRefObject<PaperSimBall[]>
}

export function CrumpledPaperPile({
  layouts,
  step,
  selectedSlipId,
  dimmed,
  darkSurface: _darkSurface,
  reducedMotion,
  bowlRotationRef,
  innerRadius,
  pileBottomY,
  pileTopY,
  paperRadius,
  paperRestOffsetY,
  liveBallsRef,
}: Props) {
  const { geometry, material } = usePaperCrumpledModel()
  useQuoteBowlPaperMaps(material)
  const meshRef = useRef<THREE.InstancedMesh>(null)
  const dummy = useMemo(() => new THREE.Object3D(), [])
  const physicsActive = step === 'pick' && !reducedMotion

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
  })

  useEffect(() => {
    material.opacity = dimmed ? QUOTE_BOWL.paper.pileDimOpacity : 1
    material.transparent = dimmed
  }, [material, dimmed])

  useFrame(() => {
    const mesh = meshRef.current
    const balls = ballsRef.current
    if (liveBallsRef) {
      liveBallsRef.current = balls
    }
    if (!mesh || balls.length === 0) return

    balls.forEach((ball, index) => {
      const hidden = selectedSlipId === ball.layout.id && step !== 'pick'

      if (hidden) {
        dummy.position.set(0, -999, 0)
        dummy.rotation.set(0, 0, 0)
        dummy.scale.setScalar(0.0001)
      } else {
        const [rx, ry, rz] = ball.layout.rotation
        const [sx, sy, sz] = ball.layout.stretch
        const tumble = physicsActive ? 0.28 : 0

        dummy.position.set(ball.x, ball.y, ball.z)
        dummy.rotation.set(
          rx + ball.vz * tumble,
          ry + ball.vx * tumble * 0.25,
          rz - ball.vx * tumble,
        )
        dummy.scale.set(
          ball.layout.scale * sx,
          ball.layout.scale * sy,
          ball.layout.scale * sz,
        )
      }
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
      raycast={() => {}}
    />
  )
}
