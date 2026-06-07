'use client'

import { useEffect, type RefObject } from 'react'

const MOVE_THRESHOLD_PX = 3
const VERTICAL_RATIO = 1.1

/** On in-flow chapters, vertical drags over the canvas should scroll the page. */
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
    const blocked: HTMLElement[] = []

    const clearPassthrough = () => {
      root.classList.remove('phone-swap__viewbox--scroll-passthrough')
      for (const el of blocked) {
        el.style.pointerEvents = ''
      }
      blocked.length = 0
    }

    const enablePassthrough = () => {
      if (scrollMode) return
      scrollMode = true
      root.classList.add('phone-swap__viewbox--scroll-passthrough')
      root.querySelectorAll('canvas').forEach((node) => {
        const canvas = node as HTMLElement
        blocked.push(canvas)
        canvas.style.pointerEvents = 'none'
      })
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
