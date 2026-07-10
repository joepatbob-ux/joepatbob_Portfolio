import { useEffect, useLayoutEffect, useRef, type ReactNode } from 'react'

interface Props {
  /** When true, reset scroll position (becomes the snap-active slide). */
  active?: boolean
  className?: string
  children: ReactNode
}

/** Scroll container for long copy; wheel routes here first, then snaps chapter at edges (chapterCopyWheel). */
export function ChapterCopyScroller({
  active = false,
  className,
  children,
}: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const wasActiveRef = useRef(false)

  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return

    if (active && !wasActiveRef.current) {
      el.scrollTop = 0
    }
    wasActiveRef.current = active
  }, [active])

  useEffect(() => {
    if (!active) return
    const el = ref.current
    if (!el) return
    el.scrollTop = 0
    const raf = requestAnimationFrame(() => {
      if (ref.current) ref.current.scrollTop = 0
    })
    return () => cancelAnimationFrame(raf)
  }, [active])

  return (
    <div
      ref={ref}
      className={['chapter-copy-scroller', className].filter(Boolean).join(' ')}
      tabIndex={-1}
      aria-label="Chapter text"
      data-copy-scroll-active={active ? 'true' : 'false'}
    >
      {children}
    </div>
  )
}
