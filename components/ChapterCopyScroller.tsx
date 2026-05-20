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
      if (!active || el.scrollHeight <= el.clientHeight + 1) return

      const { scrollTop, scrollHeight, clientHeight } = el
      const atTop = scrollTop <= 0
      const atBottom = scrollTop + clientHeight >= scrollHeight - 1

      if ((e.deltaY > 0 && !atBottom) || (e.deltaY < 0 && !atTop)) {
        e.preventDefault()
        e.stopPropagation()
      }
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
