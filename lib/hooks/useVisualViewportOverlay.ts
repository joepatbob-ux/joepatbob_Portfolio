import {
  clearVisualViewportSync,
  syncElementToVisualViewport,
} from '@/lib/mobileViewport'
import { type RefObject, useLayoutEffect } from 'react'

/** Keep a fixed overlay sized to the visible viewport (Safari URL + bottom bars). */
export function useVisualViewportOverlay(
  ref: RefObject<HTMLElement | null>,
  active: boolean,
): void {
  useLayoutEffect(() => {
    if (!active) return

    const el = ref.current
    if (!el) return

    const run = () => {
      const node = ref.current
      if (node) syncElementToVisualViewport(node)
    }

    run()
    const vv = window.visualViewport
    vv?.addEventListener('resize', run)
    vv?.addEventListener('scroll', run)
    window.addEventListener('resize', run, { passive: true })

    return () => {
      vv?.removeEventListener('resize', run)
      vv?.removeEventListener('scroll', run)
      window.removeEventListener('resize', run)
      clearVisualViewportSync(el)
    }
  }, [active])
}
