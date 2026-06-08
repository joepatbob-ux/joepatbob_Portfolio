'use client'

import { LAYOUT_MQ } from '@/lib/layout/breakpoints'
import { useLayoutEffect } from 'react'

/** Sync fixed hero pin to iOS Safari's visible viewport (avoids bottom gap above browser chrome). */
export function useMobileHeroViewport(): void {
  useLayoutEffect(() => {
    const mq = window.matchMedia(LAYOUT_MQ.topBarNav)
    if (!mq.matches) return

    const root = document.documentElement

    const sync = () => {
      if (!mq.matches) {
        root.style.removeProperty('--hero-vv-height')
        root.style.removeProperty('--hero-vv-offset-top')
        return
      }

      const vv = window.visualViewport
      if (vv) {
        root.style.setProperty('--hero-vv-height', `${vv.height}px`)
        root.style.setProperty('--hero-vv-offset-top', `${vv.offsetTop}px`)
      } else {
        root.style.setProperty('--hero-vv-height', `${window.innerHeight}px`)
        root.style.setProperty('--hero-vv-offset-top', '0px')
      }
    }

    sync()
    mq.addEventListener('change', sync)
    window.visualViewport?.addEventListener('resize', sync)
    window.visualViewport?.addEventListener('scroll', sync)
    window.addEventListener('resize', sync, { passive: true })
    window.addEventListener('orientationchange', sync)

    return () => {
      mq.removeEventListener('change', sync)
      window.visualViewport?.removeEventListener('resize', sync)
      window.visualViewport?.removeEventListener('scroll', sync)
      window.removeEventListener('resize', sync)
      window.removeEventListener('orientationchange', sync)
      root.style.removeProperty('--hero-vv-height')
      root.style.removeProperty('--hero-vv-offset-top')
    }
  }, [])
}
