'use client'

import { QUOTE_BOWL } from '@/lib/everything-in-between/quoteBowl/constants'
import { useThree } from '@react-three/fiber'
import { useLayoutEffect } from 'react'

/** Keeps renderer exposure in sync when the page theme toggles (onCreated only runs once). */
export function BowlGlThemeSync({ darkSurface }: { darkSurface: boolean }) {
  const gl = useThree((s) => s.gl)
  const invalidate = useThree((s) => s.invalidate)

  useLayoutEffect(() => {
    gl.toneMappingExposure = darkSurface
      ? QUOTE_BOWL.darkSurface.toneMappingExposure
      : QUOTE_BOWL.lightSurface.toneMappingExposure
    invalidate()
  }, [darkSurface, gl, invalidate])

  return null
}
