'use client'

import { LAYOUT_MQ } from '@/lib/layout/breakpoints'
import { useEffect, useState } from 'react'

/** Phone + tablet (≤1023) — top-bar overlay nav. */
export function useLayoutTopBarNav(): boolean {
  const [active, setActive] = useState(() => {
    if (typeof window === 'undefined') return false
    return window.matchMedia(LAYOUT_MQ.topBarNav).matches
  })

  useEffect(() => {
    const mq = window.matchMedia(LAYOUT_MQ.topBarNav)
    const sync = () => setActive(mq.matches)
    mq.addEventListener('change', sync)
    return () => mq.removeEventListener('change', sync)
  }, [])

  return active
}
