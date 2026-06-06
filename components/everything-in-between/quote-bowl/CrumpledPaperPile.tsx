'use client'

import type { QuoteBowlStep } from '@/lib/everything-in-between/quoteBowl/types'
import type { QuoteSlipLayout } from '@/lib/everything-in-between/quotePaper'
import { usePaperCrumpledModel } from '@/lib/everything-in-between/usePaperCrumpledModel'
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'

type Props = {
  layouts: readonly QuoteSlipLayout[]
  step: QuoteBowlStep
  selectedSlipId: number | null
  dimmed: boolean
}

export function CrumpledPaperPile({
  layouts,
  step,
  selectedSlipId,
  dimmed,
}: Props) {
  const { geometry, material } = usePaperCrumpledModel()
  const meshRef = useRef<THREE.InstancedMesh>(null)
  const dummy = useMemo(() => new THREE.Object3D(), [])

  useEffect(() => {
    material.opacity = dimmed ? 0.22 : 1
    material.transparent = dimmed
  }, [material, dimmed])

  const syncInstanceMatrices = useCallback(() => {
    const mesh = meshRef.current
    if (!mesh) return

    layouts.forEach((layout, index) => {
      const hidden = selectedSlipId === layout.id && step !== 'pick'

      if (hidden) {
        dummy.position.set(0, -999, 0)
        dummy.rotation.set(0, 0, 0)
        dummy.scale.setScalar(0.0001)
      } else {
        dummy.position.set(...layout.position)
        dummy.rotation.set(...layout.rotation)
        dummy.scale.setScalar(layout.scale)
      }
      dummy.updateMatrix()
      mesh.setMatrixAt(index, dummy.matrix)
    })
    mesh.instanceMatrix.needsUpdate = true
  }, [dummy, layouts, selectedSlipId, step])

  useLayoutEffect(() => {
    syncInstanceMatrices()
  }, [syncInstanceMatrices])

  return (
    <instancedMesh
      ref={meshRef}
      args={[geometry, material, layouts.length]}
      castShadow={false}
      receiveShadow={false}
      renderOrder={4}
      frustumCulled={false}
      raycast={() => {}}
    />
  )
}
