'use client'

import type { FortuneColor, FortuneTellerStep } from '@/lib/everything-in-between/fortuneTeller'
import {
  FLAP_SPECS,
  ORIGAMI_SIZE,
  type FlapId,
  type FlapSpec,
  flapOpenAngle,
  mixHex,
  origamiGroupTilt,
} from '@/lib/everything-in-between/fortuneTeller3d'
import { createFortuneTellerPaperTexture } from '@/lib/everything-in-between/fortuneTellerPaperTexture'
import { ContactShadows, Environment, Text } from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber'
import { useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'

type Props = {
  colors: readonly FortuneColor[]
  step: FortuneTellerStep
  pinchTick: number
  colorIndex: number
  reducedMotion: boolean
  onPickColor: (index: number) => void
}

function triangleGeometry(
  a: THREE.Vector3,
  b: THREE.Vector3,
  c: THREE.Vector3,
): THREE.BufferGeometry {
  const geometry = new THREE.BufferGeometry()
  const vertices = new Float32Array([
    a.x,
    a.y,
    a.z,
    b.x,
    b.y,
    b.z,
    c.x,
    c.y,
    c.z,
  ])
  geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3))
  geometry.computeVertexNormals()
  return geometry
}

function flapTrianglePoints(
  specId: FlapId,
): [THREE.Vector3, THREE.Vector3, THREE.Vector3] {
  const s = ORIGAMI_SIZE
  switch (specId) {
    case 'top':
      return [
        new THREE.Vector3(-s, 0, 0),
        new THREE.Vector3(s, 0, 0),
        new THREE.Vector3(0, 0, s),
      ]
    case 'right':
      return [
        new THREE.Vector3(0, 0, -s),
        new THREE.Vector3(0, 0, s),
        new THREE.Vector3(-s, 0, 0),
      ]
    case 'bottom':
      return [
        new THREE.Vector3(s, 0, 0),
        new THREE.Vector3(-s, 0, 0),
        new THREE.Vector3(0, 0, -s),
      ]
    case 'left':
      return [
        new THREE.Vector3(0, 0, s),
        new THREE.Vector3(0, 0, -s),
        new THREE.Vector3(s, 0, 0),
      ]
  }
}

function OrigamiFlap({
  spec,
  color,
  index,
  step,
  colorIndex,
  targetAngle,
  pickable,
  paperTexture,
  onPickColor,
}: {
  spec: FlapSpec
  color: FortuneColor
  index: number
  step: FortuneTellerStep
  colorIndex: number
  targetAngle: number
  pickable: boolean
  paperTexture: THREE.CanvasTexture
  onPickColor: (index: number) => void
}) {
  const hingeRef = useRef<THREE.Group>(null)
  const [hovered, setHovered] = useState(false)
  const angleRef = useRef(0)

  const geometry = useMemo(
    () => triangleGeometry(...flapTrianglePoints(spec.id)),
    [spec.id],
  )

  const material = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      map: paperTexture,
      color: new THREE.Color(mixHex('#faf6eb', color.tint, 0.28)),
      roughness: 0.82,
      metalness: 0.02,
      side: THREE.DoubleSide,
    })
  }, [color.tint, paperTexture])

  useEffect(() => {
    return () => {
      geometry.dispose()
      material.dispose()
    }
  }, [geometry, material])

  const selected = step === 'pinching' && colorIndex === index

  useFrame((_, delta) => {
    const hinge = hingeRef.current
    if (!hinge) return
    const lift = pickable && hovered ? targetAngle + 0.08 : targetAngle
    angleRef.current = THREE.MathUtils.lerp(angleRef.current, lift, 1 - Math.pow(0.001, delta))
    const angle = angleRef.current * spec.sign
    if (spec.axis === 'x') hinge.rotation.x = angle
    else hinge.rotation.z = angle

    const tintAmount = selected ? 0.42 : hovered && pickable ? 0.34 : 0.28
    material.color.set(mixHex('#faf6eb', color.tint, tintAmount))
    material.emissive.set(selected ? color.tint : '#000000')
    material.emissiveIntensity = selected ? 0.14 : hovered && pickable ? 0.06 : 0
  })

  return (
    <group position={spec.hinge}>
      <group ref={hingeRef}>
        <mesh
          geometry={geometry}
          material={material}
          castShadow
          receiveShadow
          onPointerOver={
            pickable
              ? (e) => {
                  e.stopPropagation()
                  setHovered(true)
                  document.body.style.cursor = 'pointer'
                }
              : undefined
          }
          onPointerOut={
            pickable
              ? () => {
                  setHovered(false)
                  document.body.style.cursor = 'auto'
                }
              : undefined
          }
          onClick={
            pickable
              ? (e) => {
                  e.stopPropagation()
                  onPickColor(index)
                }
              : undefined
          }
        />
        <Text
          position={spec.labelPosition}
          rotation={spec.labelRotation}
          fontSize={0.17}
          color="#2a2a2a"
          anchorX="center"
          anchorY="middle"
          letterSpacing={0.06}
          maxWidth={ORIGAMI_SIZE * 1.1}
        >
          {color.label.toUpperCase()}
        </Text>
      </group>
    </group>
  )
}

function CeramicBowl() {
  const geometry = useMemo(() => {
    const points: THREE.Vector2[] = []
    for (let i = 0; i <= 16; i += 1) {
      const t = i / 16
      const x = 1.55 + t * 0.55
      const y = Math.sin(t * Math.PI * 0.52) * 0.34
      points.push(new THREE.Vector2(x, y))
    }
    return new THREE.LatheGeometry(points, 48)
  }, [])

  useEffect(() => () => geometry.dispose(), [geometry])

  return (
    <mesh geometry={geometry} position={[0, -0.18, 0]} receiveShadow>
      <meshStandardMaterial
        color="#e8e2d8"
        roughness={0.62}
        metalness={0.04}
        side={THREE.DoubleSide}
      />
    </mesh>
  )
}

function CenterStud() {
  return (
    <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <circleGeometry args={[ORIGAMI_SIZE * 0.12, 24]} />
      <meshStandardMaterial color="#f0ebe0" roughness={0.88} metalness={0} />
    </mesh>
  )
}

function CameraRig() {
  const camera = useThree((s) => s.camera)
  useEffect(() => {
    camera.position.set(0, 2.35, 3.15)
    camera.lookAt(0, 0.45, 0)
    camera.updateProjectionMatrix()
  }, [camera])
  return null
}

export function ConceptFortuneTellerCanvas({
  colors,
  step,
  pinchTick,
  colorIndex,
  reducedMotion,
  onPickColor,
}: Props) {
  const rootRef = useRef<THREE.Group>(null)
  const pointer = useRef({ x: 0, y: 0 })
  const tiltRef = useRef({ x: 0, y: 0 })
  const scaleRef = useRef(1)
  const invalidate = useThree((s) => s.invalidate)

  const paperTexture = useMemo(() => createFortuneTellerPaperTexture(), [])
  useEffect(() => () => paperTexture.dispose(), [paperTexture])

  const targetAngle = flapOpenAngle(step, pinchTick, reducedMotion)
  const pickable = step === 'pick-color'

  useEffect(() => {
    invalidate()
  }, [step, pinchTick, colorIndex, invalidate])

  useFrame((state, delta) => {
    const root = rootRef.current
    if (!root) return

    const t = state.clock.elapsedTime
    const bob = reducedMotion ? 0 : Math.sin(t * 1.35) * 0.035
    const groupTilt = origamiGroupTilt(step, pinchTick)

    let targetTiltX = groupTilt + bob
    let targetTiltZ = bob * 0.45

    if (step === 'pick-color' && !reducedMotion) {
      targetTiltX += pointer.current.y * 0.14
      targetTiltZ += pointer.current.x * 0.18
    }

    if (step === 'pinching' && !reducedMotion) {
      targetTiltZ += Math.sin(t * 16) * 0.025
    }

    tiltRef.current.x = THREE.MathUtils.lerp(
      tiltRef.current.x,
      targetTiltX,
      1 - Math.pow(0.001, delta),
    )
    tiltRef.current.y = THREE.MathUtils.lerp(
      tiltRef.current.y,
      targetTiltZ,
      1 - Math.pow(0.001, delta),
    )

    root.rotation.x = tiltRef.current.x
    root.rotation.z = tiltRef.current.y

    const targetScale =
      step === 'revealed' ? 0.72 : step === 'pick-number' ? 0.96 : 1
    scaleRef.current = THREE.MathUtils.lerp(
      scaleRef.current,
      targetScale,
      1 - Math.pow(0.001, delta),
    )
    root.scale.setScalar(scaleRef.current)

    if (step === 'pick-number') {
      root.rotation.y = THREE.MathUtils.lerp(root.rotation.y, 0.28, 0.06)
    } else {
      root.rotation.y = THREE.MathUtils.lerp(root.rotation.y, 0, 0.08)
    }

    invalidate()
  })

  return (
    <>
      <CameraRig />
      <ambientLight intensity={0.62} />
      <directionalLight position={[3.5, 5, 4]} intensity={1.15} castShadow />
      <directionalLight position={[-3, 2.5, -2]} intensity={0.35} />
      <hemisphereLight args={['#faf6eb', '#2a2a2a', 0.28]} />
      <Environment preset="studio" environmentIntensity={0.42} />

      <group
        ref={rootRef}
        position={[0, 0.42, 0]}
        onPointerMove={(e) => {
          if (step !== 'pick-color') return
          pointer.current.x = e.pointer.x
          pointer.current.y = e.pointer.y
        }}
        onPointerLeave={() => {
          pointer.current.x = 0
          pointer.current.y = 0
        }}
      >
        <CeramicBowl />
        <group position={[0, 0.08, 0]}>
          {FLAP_SPECS.map((spec, index) => {
            const color = colors[index]
            if (!color) return null
            return (
              <OrigamiFlap
                key={spec.id}
                spec={spec}
                color={color}
                index={index}
                step={step}
                colorIndex={colorIndex}
                targetAngle={targetAngle}
                pickable={pickable}
                paperTexture={paperTexture}
                onPickColor={onPickColor}
              />
            )
          })}
          <CenterStud />
        </group>
      </group>

      <ContactShadows
        position={[0, -0.08, 0]}
        opacity={0.34}
        scale={8}
        blur={2.4}
        far={4}
      />
    </>
  )
}
