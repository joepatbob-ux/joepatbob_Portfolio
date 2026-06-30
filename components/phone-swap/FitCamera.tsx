'use client'

import { useThree } from '@react-three/fiber'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'
import { useLayoutEffect } from 'react'
import * as THREE from 'three'

/** Frame camera on a normalized object (origin-centered). */
export function FitCamera({
  subject,
  margin = 1.35,
}: {
  subject: THREE.Object3D
  margin?: number
}) {
  const camera = useThree((s) => s.camera)
  const controls = useThree((s) => s.controls) as OrbitControlsImpl | undefined

  useLayoutEffect(() => {
    if (!(camera instanceof THREE.PerspectiveCamera)) return

    subject.updateMatrixWorld(true)
    const box = new THREE.Box3().setFromObject(subject)
    const sphere = box.getBoundingSphere(new THREE.Sphere())
    const radius = sphere.radius || 1.1
    const fovRad = (camera.fov * Math.PI) / 180
    const distance = (radius / Math.sin(fovRad / 2)) * margin

    camera.position.set(0, 0, distance)
    camera.near = Math.max(0.01, distance / 100)
    camera.far = distance * 50
    camera.lookAt(0, 0, 0)
    camera.updateProjectionMatrix()

    if (controls) {
      controls.target.set(0, 0, 0)
      controls.minDistance = radius * 0.75
      controls.maxDistance = radius * 5
      controls.update()
    }
  }, [camera, controls, subject, margin])

  return null
}
