import { useFrame, useThree } from '@react-three/fiber'
import { useEffect, useRef } from 'react'
import * as THREE from 'three'

/** Attach an external Object3D to the R3F scene (avoids primitive quirks). */
export function SceneObject({ object }: { object: THREE.Object3D }) {
  const { scene } = useThree()
  const logged = useRef(false)

  useEffect(() => {
    scene.add(object)
    object.updateMatrixWorld(true)
    return () => {
      scene.remove(object)
    }
  }, [object, scene])

  useFrame((state) => {
    if (logged.current) return
    logged.current = true
  })

  return null
}
