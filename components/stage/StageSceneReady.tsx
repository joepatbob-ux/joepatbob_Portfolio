import { useEffect, type ReactNode } from 'react'

type Props = {
  onReady: () => void
  children: ReactNode
}

/** Signals when Suspense children (chunk + R3F loaders) have committed. */
export function StageSceneReady({ onReady, children }: Props) {
  useEffect(() => {
    onReady()
  }, [onReady])

  return children
}
