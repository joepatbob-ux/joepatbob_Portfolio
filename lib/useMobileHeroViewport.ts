'use client'

import { resetTopBarHeroScrollHysteresis } from '@/lib/heroScroll'
import { LAYOUT_MQ } from '@/lib/layout/breakpoints'
import { getLayoutViewportHeight, getLayoutViewportOffsetTop } from '@/lib/mobileViewport'
import { useLayoutEffect } from 'react'

const HYSTERESIS_RESET_PX = 24
const HYSTERESIS_RESET_GRACE_MS = 500
let lastSyncedHeight = 0
let lastSyncedOffsetTop = 0
let hysteresisResetGraceUntil = 0

/** Reset hero/rail hysteresis when iOS Safari resizes the visual viewport (URL bar). */
function onMobileViewportResize(): void {
  if (typeof window === 'undefined') return
  if (performance.now() < hysteresisResetGraceUntil) return
  if (!window.matchMedia(LAYOUT_MQ.topBarNav).matches) {
    lastSyncedHeight = 0
    lastSyncedOffsetTop = 0
    return
  }

  const h = Math.round(getLayoutViewportHeight())
  const offset = Math.round(getLayoutViewportOffsetTop())
  if (h <= 0) return

  const heightDelta = Math.abs(h - lastSyncedHeight)
  // offsetTop shifts when the URL bar slides in/out (iOS Safari) even when
  // height change is within threshold — track it separately to catch those cases.
  const offsetDelta = Math.abs(offset - lastSyncedOffsetTop)

  if (lastSyncedHeight > 0 && (heightDelta >= HYSTERESIS_RESET_PX || offsetDelta >= 4)) {
    resetTopBarHeroScrollHysteresis()
  }

  lastSyncedHeight = h
  lastSyncedOffsetTop = offset
}

/** Phone + tablet: listen for visualViewport changes (scroll math only — heights are CSS). */
export function useMobileHeroViewport(): void {
  useLayoutEffect(() => {
    hysteresisResetGraceUntil = performance.now() + HYSTERESIS_RESET_GRACE_MS
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
      lastSyncedOffsetTop = 0
    }
  }, [])
}
