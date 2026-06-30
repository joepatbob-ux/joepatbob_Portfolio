'use client'

import { useFrame } from '@react-three/fiber'
import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
} from 'react'
import * as THREE from 'three'

const LERP = 0.12

export interface PhoneModelProps {
  scene: THREE.Object3D
  position: [number, number, number]
  rotationY: number
  scale: number
  renderOrder: number
  /** When true, snap to targets (layout capture mode). */
  snap?: boolean
}

export const PhoneModel = forwardRef<THREE.Group, PhoneModelProps>(
  function PhoneModel(
    { scene, position, rotationY, scale, renderOrder, snap = false },
    ref,
  ) {
    const groupRef = useRef<THREE.Group>(null)
    const initialized = useRef(false)
    const targetPosition = useRef(new THREE.Vector3(...position))
    const targetRotationY = useRef(rotationY)
    const targetScale = useRef(scale)

    useImperativeHandle(ref, () => groupRef.current!, [])

    const applySnap = () => {
      const group = groupRef.current
      if (!group) return
      group.position.set(
        targetPosition.current.x,
        targetPosition.current.y,
        targetPosition.current.z,
      )
      group.rotation.y = targetRotationY.current
      group.scale.setScalar(targetScale.current)
    }

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

    useLayoutEffect(() => {
      targetPosition.current.set(position[0], position[1], position[2])
      targetRotationY.current = rotationY
      targetScale.current = scale
      if (snap) applySnap()
    }, [position, rotationY, scale, snap])

    useEffect(() => {
      targetPosition.current.set(position[0], position[1], position[2])
      targetRotationY.current = rotationY
      targetScale.current = scale
    }, [position[0], position[1], position[2], rotationY, scale, renderOrder, snap])

    const loggedFrame = useRef(false)

    useFrame(() => {
      const group = groupRef.current
      if (!group) return

      if (snap) {
        applySnap()
        return
      }

      if (!loggedFrame.current) {
        loggedFrame.current = true
      }

      group.position.lerp(targetPosition.current, LERP)
      group.rotation.y = THREE.MathUtils.lerp(
        group.rotation.y,
        targetRotationY.current,
        LERP,
      )
      const nextScale = THREE.MathUtils.lerp(
        group.scale.x,
        targetScale.current,
        LERP,
      )
      group.scale.setScalar(nextScale)
    })

    return (
      <group ref={groupRef}>
        <primitive object={scene} frustumCulled={false} />
      </group>
    )
  },
)
