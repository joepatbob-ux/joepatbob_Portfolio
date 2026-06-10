'use client'

import { useEffect, type RefObject } from 'react'

const MOVE_THRESHOLD_PX = 8
const VERTICAL_RATIO = 1.15

/**
 * In-flow chapters: distinguish vertical scroll from tap-to-swap on the 3D canvas.
 * Canvas keeps pointer events; during a vertical drag we temporarily pass scroll through.
 */
export function usePhoneSwapTouchScroll(
  ref: RefObject<HTMLElement | null>,
  enabled: boolean,
) {
  useEffect(() => {
    if (!enabled) return
    const root = ref.current
    if (!root) return

    let startY = 0
    let startX = 0
    let scrollMode = false

    const clearPassthrough = () => {
      root.classList.remove('phone-swap__viewbox--scroll-passthrough')
    }

    const enablePassthrough = () => {
      if (scrollMode) return
      scrollMode = true
      root.classList.add('phone-swap__viewbox--scroll-passthrough')
    }

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length !== 1) return
      scrollMode = false
      clearPassthrough()
      startY = e.touches[0].clientY
      startX = e.touches[0].clientX
    }

    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length !== 1 || scrollMode) return
      const dy = e.touches[0].clientY - startY
      const dx = e.touches[0].clientX - startX
      const ady = Math.abs(dy)
      const adx = Math.abs(dx)
      if (ady > MOVE_THRESHOLD_PX && ady > adx * VERTICAL_RATIO) {
        enablePassthrough()
      }
    }

    const onTouchEnd = () => {
      if (scrollMode) {
        requestAnimationFrame(clearPassthrough)
      }
      scrollMode = false
    }

    root.addEventListener('touchstart', onTouchStart, { passive: true, capture: true })
    root.addEventListener('touchmove', onTouchMove, { passive: true, capture: true })
    root.addEventListener('touchend', onTouchEnd, { passive: true, capture: true })
    root.addEventListener('touchcancel', onTouchEnd, { passive: true, capture: true })

    return () => {
      root.removeEventListener('touchstart', onTouchStart, { capture: true })
      root.removeEventListener('touchmove', onTouchMove, { capture: true })
      root.removeEventListener('touchend', onTouchEnd, { capture: true })
      root.removeEventListener('touchcancel', onTouchEnd, { capture: true })
      clearPassthrough()
    }
  }, [enabled, ref])
}
