'use client'

import { useLayoutEffect, type RefObject } from 'react'
import { scheduleScrollFrameSync } from '@/lib/scrollFrame'

/** Imperatively tracks an anchor's viewport rect onto a fixed portal (no React state on scroll). */
export function useAnchorPortalFollow(
  anchorRef: RefObject<HTMLElement | null>,
  portalRef: RefObject<HTMLElement | null>,
  enabled: boolean,
) {
  useLayoutEffect(() => {
    if (!enabled) return

    let lastW = 0
    let lastH = 0

    const sync = () => {
      const anchor = anchorRef.current
      const portal = portalRef.current
      if (!anchor || !portal) return

      const r = anchor.getBoundingClientRect()
      if (r.width < 1 || r.height < 1) {
        portal.style.visibility = 'hidden'
        portal.style.pointerEvents = 'none'
        return
      }

      portal.style.visibility = ''
      portal.style.pointerEvents = ''
      portal.style.transform = `translate3d(${r.left}px, ${r.top}px, 0)`

      const w = Math.round(r.width)
      const h = Math.round(r.height)
      if (w !== lastW || h !== lastH) {
        portal.style.width = `${r.width}px`
        portal.style.height = `${r.height}px`
        lastW = w
        lastH = h
      }
    }

    const anchor = anchorRef.current
    if (!anchor) return

    sync()
    const ro = new ResizeObserver(sync)
    ro.observe(anchor)
    const unsubScroll = scheduleScrollFrameSync(sync)
    window.addEventListener('resize', sync)

    return () => {
      ro.disconnect()
      unsubScroll()
      window.removeEventListener('resize', sync)
    }
  }, [anchorRef, portalRef, enabled])
}
