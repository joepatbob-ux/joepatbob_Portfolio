'use client'

import { useEffect, useState } from 'react'
import { usePrefersReducedMotion } from '@/lib/hooks/usePrefersReducedMotion'
import { PRELOADER_ICONS } from '@/lib/preloader/iconPaths'
import { isCollapsedInner, sampleMorphFrame, type MorphFrame } from '@/lib/preloader/morphEngine'

const STATIC_FRAME: MorphFrame = {
  frameD: PRELOADER_ICONS[0].frame,
  innerDs: [...PRELOADER_ICONS[0].inners],
  iconIndex: 0,
  label: PRELOADER_ICONS[0].label,
  morphing: false,
}

export function useIconMorph(active = true): MorphFrame {
  const reducedMotion = usePrefersReducedMotion()
  const [frame, setFrame] = useState<MorphFrame>(STATIC_FRAME)

  useEffect(() => {
    if (!active || reducedMotion) {
      setFrame(STATIC_FRAME)
      return
    }

    const start = performance.now()
    let raf = 0

    const tick = (now: number) => {
      setFrame(sampleMorphFrame(now - start))
      raf = requestAnimationFrame(tick)
    }

    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [active, reducedMotion])

  return reducedMotion ? STATIC_FRAME : frame
}
