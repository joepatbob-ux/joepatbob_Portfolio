'use client'

import { QUOTE_BOWL } from '@/lib/everything-in-between/quoteBowl/constants'
import { useFrame, useThree } from '@react-three/fiber'
import { type RefObject, useMemo } from 'react'
import * as THREE from 'three'

type Props = {
  topY: number
  stackRef: RefObject<HTMLElement | null>
}

/** Projects the bowl rim to `--quote-bowl-rim-top` on the HTML stack. */
export function QuoteBowlRimTracker({ topY, stackRef }: Props) {
  const { camera, size } = useThree()
  const world = useMemo(() => new THREE.Vector3(), [])

  useFrame(() => {
    const stack = stackRef.current
    if (!stack) return

    world.set(0, topY + QUOTE_BOWL.contentYOffset, 0)
    world.project(camera)

    const stage = stack.querySelector('.quote-bowl__stage')
    const stageHeight =
      stage instanceof HTMLElement ? stage.clientHeight : stack.clientHeight
    const scale = size.height > 0 ? stageHeight / size.height : 1
    const rimTopPx = ((1 - world.y) / 2) * size.height * scale

    stack.style.setProperty('--quote-bowl-rim-top', `${rimTopPx}px`)
  })

  return null
}
