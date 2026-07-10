import { useLayoutEffect, useState, type RefObject } from 'react'
import { scheduleScrollFrame } from '@/lib/scroll/scrollFrame'

/** Tracks an element's viewport rect; updates on scroll, resize, and layout changes. */
export function useAnchorViewportRect(
  anchorRef: RefObject<HTMLElement | null>,
): DOMRect | null {
  const [rect, setRect] = useState<DOMRect | null>(null)

  useLayoutEffect(() => {
    const el = anchorRef.current
    if (!el) return

    const sync = () => {
      const next = el.getBoundingClientRect()
      if (next.width < 1 || next.height < 1) {
        setRect(null)
        return
      }
      setRect(next)
    }

    sync()
    const ro = new ResizeObserver(sync)
    ro.observe(el)
    const unsubScroll = scheduleScrollFrame(sync)
    window.addEventListener('resize', sync)

    return () => {
      ro.disconnect()
      unsubScroll()
      window.removeEventListener('resize', sync)
    }
  }, [anchorRef])

  return rect
}
