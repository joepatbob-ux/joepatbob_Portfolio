'use client'

import { resetTopBarHeroScrollHysteresis } from '@/lib/heroScroll'
import { LAYOUT_MQ } from '@/lib/layout/breakpoints'
import { getLayoutViewportHeight } from '@/lib/mobileViewport'
import { useLayoutEffect } from 'react'

const HYSTERESIS_RESET_PX = 24
let lastSyncedHeight = 0

/** Reset hero/rail hysteresis when iOS Safari resizes the visual viewport (URL bar). */
function onMobileViewportResize(): void {
  if (typeof window === 'undefined') return
  if (!window.matchMedia(LAYOUT_MQ.topBarNav).matches) {
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
}

/** Phone + tablet: listen for visualViewport changes (scroll math only — heights are CSS). */
export function useMobileHeroViewport(): void {
  useLayoutEffect(() => {
    const mq = window.matchMedia(LAYOUT_MQ.topBarNav)
    const run = () => onMobileViewportResize()

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
      lastSyncedHeight = 0
    }
  }, [])
}
