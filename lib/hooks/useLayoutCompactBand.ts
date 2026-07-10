import { LAYOUT_MQ } from '@/lib/layout/breakpoints'
import { useEffect, useState } from 'react'

/** Tablet (768–1023): centered stack + More/Less in-place expand. */
export function useLayoutCompactBand(): boolean {
  const [compact, setCompact] = useState(() => {
    if (typeof window === 'undefined') return false
    return window.matchMedia(LAYOUT_MQ.compactBand).matches
  })

  useEffect(() => {
    const mq = window.matchMedia(LAYOUT_MQ.compactBand)
    const sync = () => setCompact(mq.matches)
    mq.addEventListener('change', sync)
    return () => mq.removeEventListener('change', sync)
  }, [])

  return compact
}
