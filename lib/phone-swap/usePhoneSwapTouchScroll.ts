'use client'

import { useEffect, type RefObject } from 'react'

const TAP_THRESHOLD_PX = 12

/**
 * In-flow chapters: canvas does not capture touch (CSS); page scroll uses the full stage box.
 * Short tap on the viewbox triggers swap — vertical drags scroll the document.
 */
export function usePhoneSwapTouchScroll(
  ref: RefObject<HTMLElement | null>,
  enabled: boolean,
  onTapSwap?: () => void,
) {
  useEffect(() => {
    if (!enabled) return
    const root = ref.current
    if (!root) return

    let startY = 0
    let startX = 0
    let moved = false

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length !== 1) return
      moved = false
      startY = e.touches[0].clientY
      startX = e.touches[0].clientX
    }

    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length !== 1) return
      const dy = Math.abs(e.touches[0].clientY - startY)
      const dx = Math.abs(e.touches[0].clientX - startX)
      if (dy > TAP_THRESHOLD_PX || dx > TAP_THRESHOLD_PX) {
        moved = true
      }
    }

    const onTouchEnd = () => {
      if (!moved && onTapSwap) {
        onTapSwap()
      }
      moved = false
    }

    root.addEventListener('touchstart', onTouchStart, { passive: true })
    root.addEventListener('touchmove', onTouchMove, { passive: true })
    root.addEventListener('touchend', onTouchEnd, { passive: true })
    root.addEventListener('touchcancel', onTouchEnd, { passive: true })

    return () => {
      root.removeEventListener('touchstart', onTouchStart)
      root.removeEventListener('touchmove', onTouchMove)
      root.removeEventListener('touchend', onTouchEnd)
      root.removeEventListener('touchcancel', onTouchEnd)
    }
  }, [enabled, onTapSwap, ref])
}
