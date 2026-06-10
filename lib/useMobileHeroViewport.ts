'use client'

import { resetTopBarHeroScrollHysteresis } from '@/lib/heroScroll'
import { LAYOUT_MQ } from '@/lib/layout/breakpoints'
import { getLayoutViewportHeight } from '@/lib/mobileViewport'
import { useLayoutEffect } from 'react'

const HYSTERESIS_RESET_PX = 24
let lastSyncedHeight = 0

function syncMobileViewportHeight(): void {
  if (typeof window === 'undefined') return
  if (!window.matchMedia(LAYOUT_MQ.topBarNav).matches) {
    document.documentElement.style.removeProperty('--mobile-viewport-min-h')
    lastSyncedHeight = 0
    return
  }

  const h = Math.round(getLayoutViewportHeight())
  if (h <= 0) return

  const delta = Math.abs(h - lastSyncedHeight)
  if (lastSyncedHeight > 0 && delta >= HYSTERESIS_RESET_PX) {
    resetTopBarHeroScrollHysteresis()
  }

  lastSyncedHeight = h
  document.documentElement.style.setProperty('--mobile-viewport-min-h', `${h}px`)
}

/** Sync `--mobile-viewport-min-h` from visualViewport on phone + tablet nav. */
export function useMobileHeroViewport(): void {
  useLayoutEffect(() => {
    const mq = window.matchMedia(LAYOUT_MQ.topBarNav)
    const run = () => syncMobileViewportHeight()

    run()
    mq.addEventListener('change', run)
    window.addEventListener('resize', run, { passive: true })

    const vv = window.visualViewport
    vv?.addEventListener('resize', run)
    vv?.addEventListener('scroll', run)

    return () => {
      mq.removeEventListener('change', run)
      window.removeEventListener('resize', run)
      vv?.removeEventListener('resize', run)
      vv?.removeEventListener('scroll', run)
      document.documentElement.style.removeProperty('--mobile-viewport-min-h')
      lastSyncedHeight = 0
    }
  }, [])
}
