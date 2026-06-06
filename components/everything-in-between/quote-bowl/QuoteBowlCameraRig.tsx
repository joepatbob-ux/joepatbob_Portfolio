'use client'

import { QUOTE_BOWL } from '@/lib/everything-in-between/quoteBowl/constants'
import { useThree } from '@react-three/fiber'
import { useEffect } from 'react'

export function QuoteBowlCameraRig() {
  const camera = useThree((s) => s.camera)
  const invalidate = useThree((s) => s.invalidate)

  useEffect(() => {
    const [px, py, pz] = QUOTE_BOWL.camera.position
    const [lx, ly, lz] = QUOTE_BOWL.camera.lookAt
    camera.position.set(px, py, pz)
    camera.lookAt(lx, ly, lz)
    camera.updateProjectionMatrix()
    invalidate()
    const id = window.requestAnimationFrame(() => invalidate())
    return () => window.cancelAnimationFrame(id)
  }, [camera, invalidate])

  return null
}
