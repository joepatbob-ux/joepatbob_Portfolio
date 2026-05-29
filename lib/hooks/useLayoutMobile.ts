'use client'

import { LAYOUT_MQ } from '@/lib/layout/breakpoints'
import { useEffect, useState } from 'react'

export function useLayoutMobile(): boolean {
  const [mobile, setMobile] = useState(() => {
    if (typeof window === 'undefined') return false
    return window.matchMedia(LAYOUT_MQ.mobile).matches
  })

  useEffect(() => {
    const mq = window.matchMedia(LAYOUT_MQ.mobile)
    const sync = () => setMobile(mq.matches)
    mq.addEventListener('change', sync)
    return () => mq.removeEventListener('change', sync)
  }, [])

  return mobile
}
