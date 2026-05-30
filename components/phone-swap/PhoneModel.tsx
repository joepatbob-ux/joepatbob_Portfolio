'use client'

import { useFrame } from '@react-three/fiber'
import { debugLog } from '@/lib/phone-swap/debugLog'
import { useEffect, useLayoutEffect, useRef } from 'react'
import * as THREE from 'three'

const LERP = 0.12

export interface PhoneModelProps {
  scene: THREE.Object3D
  position: [number, number, number]
  rotationY: number
  scale: number
  renderOrder: number
}

export function PhoneModel({
  scene,
  position,
  rotationY,
  scale,
  renderOrder,
}: PhoneModelProps) {
  const groupRef = useRef<THREE.Group>(null)
  const initialized = useRef(false)
  const targetPosition = useRef(new THREE.Vector3(...position))
  const targetRotationY = useRef(rotationY)
  const targetScale = useRef(scale)

  useLayoutEffect(() => {
    const group = groupRef.current
    if (!group || initialized.current) return
    group.position.set(position[0], position[1], position[2])
    group.rotation.y = rotationY
    group.scale.setScalar(scale)
    targetPosition.current.set(position[0], position[1], position[2])
    targetRotationY.current = rotationY
    targetScale.current = scale
    initialized.current = true
  }, [position, rotationY, scale])

  useEffect(() => {
    targetPosition.current.set(position[0], position[1], position[2])
    targetRotationY.current = rotationY
    targetScale.current = scale
    // #region agent log
    debugLog(
      'PhoneModel.tsx:target',
      'swap target updated (lerp, no snap)',
      {
        x: position[0],
        y: position[1],
        z: position[2],
        rotationY,
        scale,
        renderOrder,
      },
      'M',
      'post-fix',
    )
    // #endregion
  }, [position[0], position[1], position[2], rotationY, scale, renderOrder])

  const loggedFrame = useRef(false)

  useFrame(() => {
    const group = groupRef.current
    if (!group) return

    if (!loggedFrame.current) {
      loggedFrame.current = true
      // #region agent log
      debugLog(
        'PhoneModel.tsx:useFrame',
        'first frame',
        {
          x: group.position.x,
          y: group.position.y,
          z: group.position.z,
          scale: group.scale.x,
          renderOrder,
        },
        'R',
        'post-fix',
      )
      // #endregion
    }

    group.position.lerp(targetPosition.current, LERP)
    group.rotation.y = THREE.MathUtils.lerp(
      group.rotation.y,
      targetRotationY.current,
      LERP,
    )
    const nextScale = THREE.MathUtils.lerp(group.scale.x, targetScale.current, LERP)
    group.scale.setScalar(nextScale)
  })

  return (
    <group ref={groupRef}>
      <primitive object={scene} frustumCulled={false} />
    </group>
  )
}
