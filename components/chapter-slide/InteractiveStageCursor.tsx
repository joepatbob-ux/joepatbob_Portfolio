'use client'

import { useCallback, useRef, useState, type ReactNode } from 'react'

const DEFAULT_RING_TARGETS = 'button, a, [role="button"]'

function pointerOverSelector(
  clientX: number,
  clientY: number,
  wrap: HTMLElement,
  selector: string,
): boolean {
  const el = document.elementFromPoint(clientX, clientY)
  if (!el || !wrap.contains(el)) return false
  return el.matches(selector) || Boolean(el.closest(selector))
}

/** Follow-cursor dot for Sensi Lite — muted fill; nav ring only over hit targets. */
export function InteractiveStageCursor({
  children,
  className,
  ringOverSelector = DEFAULT_RING_TARGETS,
}: {
  children: ReactNode
  className?: string
  /** Elements that show the nav hover ring (within this wrap). */
  ringOverSelector?: string
}) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const [hovering, setHovering] = useState(false)
  const [overTarget, setOverTarget] = useState(false)
  const [pos, setPos] = useState({ x: 0, y: 0 })

  const updateFromPointer = useCallback(
    (clientX: number, clientY: number) => {
      const wrap = wrapRef.current
      if (!wrap) return
      const rect = wrap.getBoundingClientRect()
      setPos({ x: clientX - rect.left, y: clientY - rect.top })
      setOverTarget(pointerOverSelector(clientX, clientY, wrap, ringOverSelector))
    },
    [ringOverSelector],
  )

  const onPointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      setHovering(true)
      updateFromPointer(e.clientX, e.clientY)
    },
    [updateFromPointer],
  )

  const onPointerLeave = useCallback(() => {
    setHovering(false)
    setOverTarget(false)
  }, [])

  return (
    <div
      ref={wrapRef}
      className={['chapter-slide__interactive-wrap', className]
        .filter(Boolean)
        .join(' ')}
      onPointerEnter={(e) => {
        setHovering(true)
        updateFromPointer(e.clientX, e.clientY)
      }}
      onPointerLeave={onPointerLeave}
      onPointerMove={onPointerMove}
    >
      <div className="chapter-slide__interactive-content">{children}</div>
      <div className="chapter-slide__interactive-dot-layer" aria-hidden>
        {hovering && (
          <div
            className={[
              'chapter-slide__interactive-dot',
              overTarget ? 'chapter-slide__interactive-dot--ring' : '',
            ]
              .filter(Boolean)
              .join(' ')}
            style={{ left: pos.x, top: pos.y }}
          />
        )}
      </div>
    </div>
  )
}
