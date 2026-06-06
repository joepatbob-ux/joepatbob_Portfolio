'use client'

import { useEffect, type RefObject } from 'react'

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'

/** Trap Tab focus inside a modal dialog and restore focus on close. */
export function useDialogFocusTrap(
  containerRef: RefObject<HTMLElement | null>,
  active: boolean,
) {
  useEffect(() => {
    if (!active) return
    const root = containerRef.current
    if (!root) return

    const previouslyFocused = document.activeElement as HTMLElement | null

    const focusables = () =>
      Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
        (el) => !el.hasAttribute('disabled') && el.tabIndex !== -1,
      )

    const focusFirst = () => {
      const items = focusables()
      const target = items[0] ?? root
      target.focus()
    }

    const raf = requestAnimationFrame(focusFirst)

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return
      const items = focusables()
      if (!items.length) {
        event.preventDefault()
        return
      }

      const first = items[0]
      const last = items[items.length - 1]
      const current = document.activeElement as HTMLElement | null

      if (event.shiftKey) {
        if (current === first || !root.contains(current)) {
          event.preventDefault()
          last.focus()
        }
        return
      }

      if (current === last) {
        event.preventDefault()
        first.focus()
      }
    }

    root.addEventListener('keydown', onKeyDown)

    return () => {
      cancelAnimationFrame(raf)
      root.removeEventListener('keydown', onKeyDown)
      previouslyFocused?.focus?.()
    }
  }, [active, containerRef])
}
