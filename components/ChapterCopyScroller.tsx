'use client'

import { useEffect, useRef, type ReactNode } from 'react'

interface Props {
  /** When false, wheel events pass through to the page slideshow. */
  active?: boolean
  className?: string
  children: ReactNode
}

/** Scroll long chapter copy inside a 100vh slide before the page advances. */
export function ChapterCopyScroller({
  active = true,
  className,
  children,
}: Props) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!active) return
    const el = ref.current
    if (el) el.scrollTop = 0
  }, [active])

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const onWheel = (e: WheelEvent) => {
      if (!active) return

      const { scrollTop, scrollHeight, clientHeight } = el
      if (scrollHeight <= clientHeight + 1) return

      let delta = e.deltaY
      if (e.deltaMode === WheelEvent.DOM_DELTA_LINE) {
        delta *= 16
      } else if (e.deltaMode === WheelEvent.DOM_DELTA_PAGE) {
        delta *= clientHeight
      }

      const atTop = scrollTop <= 0
      const atBottom = scrollTop + clientHeight >= scrollHeight - 1

      if (delta > 0 && atBottom) return
      if (delta < 0 && atTop) return

      e.preventDefault()
      e.stopPropagation()
      el.scrollTop = Math.max(
        0,
        Math.min(scrollTop + delta, scrollHeight - clientHeight),
      )
    }

    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [active])

  return (
    <div
      ref={ref}
      className={['chapter-copy-scroller', className].filter(Boolean).join(' ')}
      tabIndex={0}
      aria-label="Chapter text"
    >
      {children}
    </div>
  )
}
