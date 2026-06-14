'use client'

import { useEffect, useState } from 'react'
import { isPrerenderSnapshot } from '@/lib/isPrerenderSnapshot'

/** True after the client has committed post-hydration effects (render #2+). */
export function useHydrated(): boolean {
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    setHydrated(true)
  }, [])

  return hydrated
}

/** Stage canvas / WebGL may mount only after hydration and outside prerender snapshot. */
export function useStageContentReady(): boolean {
  const hydrated = useHydrated()
  return hydrated && !isPrerenderSnapshot()
}
