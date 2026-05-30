'use client'

import { useEffect, useRef, type ReactNode } from 'react'

interface Props {
  /** When true, reset scroll position (becomes the snap-active slide). */
  active?: boolean
  className?: string
  children: ReactNode
}

/** Scroll container for long copy; at scroll edges, wheel advances the snap chapter (useChapterCopyWheelTrap). */
export function ChapterCopyScroller({
  active = false,
  className,
  children,
}: Props) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!active) return
    const el = ref.current
    if (el) el.scrollTop = 0
  }, [active])

  return (
    <div
      ref={ref}
      className={['chapter-copy-scroller', className].filter(Boolean).join(' ')}
      tabIndex={-1}
      aria-label="Chapter text"
    >
      {children}
    </div>
  )
}
