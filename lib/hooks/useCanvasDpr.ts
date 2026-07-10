import { useEffect, useState } from 'react'

export function useCanvasDpr(maxDpr = 2): number {
  const [dpr, setDpr] = useState(1)

  useEffect(() => {
    const sync = () => setDpr(Math.min(window.devicePixelRatio || 1, maxDpr))
    sync()
    window.addEventListener('resize', sync)
    return () => window.removeEventListener('resize', sync)
  }, [maxDpr])

  return dpr
}
