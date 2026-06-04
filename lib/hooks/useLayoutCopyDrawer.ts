'use client'

import { LAYOUT_MQ } from '@/lib/layout/breakpoints'
import { useEffect, useState } from 'react'

/** Tablet + narrow desktop: stage full width, copy in a right drawer (768–1199). */
export function useLayoutCopyDrawer(): boolean {
  const [drawer, setDrawer] = useState(() => {
    if (typeof window === 'undefined') return false
    return window.matchMedia(LAYOUT_MQ.copyDrawer).matches
  })

  useEffect(() => {
    const mq = window.matchMedia(LAYOUT_MQ.copyDrawer)
    const sync = () => setDrawer(mq.matches)
    mq.addEventListener('change', sync)
    return () => mq.removeEventListener('change', sync)
  }, [])

  return drawer
}
