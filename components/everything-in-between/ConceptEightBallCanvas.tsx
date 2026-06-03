'use client'

import { FitCamera } from '@/components/phone-swap/FitCamera'
import { sampleMagic8BallRoll } from '@/lib/everything-in-between/magic8BallRoll'
import {
  getMagic8BallDieHome,
  getMagic8BallGlassTarget,
} from '@/lib/everything-in-between/magic8BallWindow'
import { useMagic8BallModels } from '@/lib/everything-in-between/useMagic8BallModels'
import { Environment } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'

const ROLL_MS = 960
/** Idle: number 8 faces the camera (+Z). */
const IDLE_ROT_X = 0
/** Reveal: tip so the glass circle faces the camera. */
const REVEAL_TILT_X = Math.PI / 2
const DIE_FLOAT_MS = 800

export type ConceptEightBallPhase = 'idle' | 'shaking' | 'revealed'

type Props = {
  phase: ConceptEightBallPhase
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

function Magic8BallModel({ phase }: Props) {
  const { root, ball, die, fitRadius, windowAnchor } = useMagic8BallModels()
  const pivotRef = useRef<THREE.Group>(null)
  const rollStartRef = useRef(0)
  const floatStartRef = useRef(0)
  const dieHome = useMemo(() => getMagic8BallDieHome(), [])
  const dieHalfDepth = useMemo(() => {
    die.updateMatrixWorld(true)
    const box = new THREE.Box3().setFromObject(die)
    const size = box.getSize(new THREE.Vector3())
    return size.y * 0.5
  }, [die])
  const dieRotStart = useRef(new THREE.Quaternion())
  const pivotY = fitRadius * 0.88

  useEffect(() => {
    if (phase === 'shaking') {
      rollStartRef.current = performance.now()
      die.position.copy(dieHome)
      die.rotation.set(0, 0, 0)
    }
    if (phase === 'revealed') {
      floatStartRef.current = performance.now()
      dieRotStart.current.identity()
    }
  }, [phase, dieHome])

  useFrame(() => {
    const pivot = pivotRef.current
    if (!pivot) return

    if (phase === 'shaking') {
      const elapsed = performance.now() - rollStartRef.current
      const progress = Math.min(elapsed / ROLL_MS, 1)
      const sample = sampleMagic8BallRoll(progress)
      pivot.rotation.x = sample.rotX + IDLE_ROT_X
      pivot.rotation.z = sample.rotZ
      pivot.position.x = sample.posX
      pivot.position.y = pivotY + sample.posY
      die.visible = true
      die.position.copy(dieHome)
      die.rotation.set(0, 0, 0)
      die.rotation.x += 0.14
      die.rotation.y += 0.22
      die.rotation.z += 0.09
      return
    }

    const targetRotX = phase === 'revealed' ? REVEAL_TILT_X : IDLE_ROT_X
    pivot.rotation.x = THREE.MathUtils.lerp(pivot.rotation.x, targetRotX, 0.1)
    pivot.rotation.z = THREE.MathUtils.lerp(pivot.rotation.z, 0, 0.14)
    pivot.position.x = THREE.MathUtils.lerp(pivot.position.x, 0, 0.14)
    pivot.position.y = THREE.MathUtils.lerp(pivot.position.y, pivotY, 0.14)

    if (phase === 'revealed') {
      die.visible = true
      const floatElapsed = performance.now() - floatStartRef.current
      const floatT = easeOutCubic(Math.min(floatElapsed / DIE_FLOAT_MS, 1))
      const glass = getMagic8BallGlassTarget(ball, windowAnchor, dieHalfDepth)

      die.position.lerpVectors(dieHome, glass.position, floatT)
      die.quaternion.slerpQuaternions(
        dieRotStart.current,
        glass.rotation,
        floatT,
      )

      if (floatT >= 0.995) {
        die.position.copy(glass.position)
        die.quaternion.copy(glass.rotation)
      }
      return
    }

    die.visible = false
    die.position.copy(dieHome)
    die.rotation.set(0, 0, 0)
  })

  return (
    <group position={[0, -pivotY, 0]}>
      <group ref={pivotRef} position={[0, pivotY, 0]}>
        <primitive object={root} />
      </group>
      <FitCamera subject={ball} margin={1.34} />
    </group>
  )
}

export function ConceptEightBallCanvas({
  phase,
  answer: _answer,
}: Props & { answer: string | null }) {
  return (
    <>
      <ambientLight intensity={0.55} />
      <directionalLight position={[4, 6, 5]} intensity={1.25} />
      <directionalLight position={[-4, 2, -3]} intensity={0.4} />
      <hemisphereLight args={['#f4f2ee', '#141414', 0.3]} />
      <Environment preset="studio" environmentIntensity={0.5} />
      <Magic8BallModel phase={phase} />
    </>
  )
}
