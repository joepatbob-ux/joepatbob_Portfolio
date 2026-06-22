'use client'

import { useEffect, useState } from 'react'
import { MorphIcon } from '@/components/preloader/MorphIcon'
import { useHydrated } from '@/lib/hooks/useHydrated'
import { isPrerenderSnapshot } from '@/lib/isPrerenderSnapshot'
import { waitForInitialReady } from '@/lib/preloader/waitForInitialReady'

const FADE_MS = 400

export function PreloaderOverlay() {
  const hydrated = useHydrated()
  const skip = isPrerenderSnapshot()
  const [visible, setVisible] = useState(!skip)
  const [exiting, setExiting] = useState(false)

  useEffect(() => {
    if (skip) return
    document.documentElement.classList.add('preloader-active')
    return () => {
      document.documentElement.classList.remove('preloader-active')
    }
  }, [skip])

  useEffect(() => {
    if (skip || visible) return
    document.documentElement.classList.remove('preloader-active')
  }, [skip, visible])

  useEffect(() => {
    if (skip || !hydrated) return

    let cancelled = false
    void waitForInitialReady().then(() => {
      if (cancelled) return
      setExiting(true)
      window.setTimeout(() => {
        if (!cancelled) setVisible(false)
      }, FADE_MS)
    })

    return () => {
      cancelled = true
    }
  }, [hydrated, skip])

  if (skip || !visible) return null

  return (
    <div
      className={['preloader-overlay', exiting ? 'preloader-overlay--exit' : '']
        .filter(Boolean)
        .join(' ')}
      role="status"
      aria-live="polite"
      aria-busy={!exiting}
      aria-label="Loading portfolio"
    >
      <MorphIcon size={56} showLabel active={!exiting} />
    </div>
  )
}
