'use client'

import { useCallback, useRef, useState } from 'react'

interface Props {
  beforeSrc: string
  afterSrc: string
  beforeAlt: string
  afterAlt: string
  caption?: string
  beforeLabel?: string
  afterLabel?: string
}

export function DragScrubber({
  beforeSrc,
  afterSrc,
  beforeAlt,
  afterAlt,
  caption,
  beforeLabel = 'Legacy',
  afterLabel = 'Current',
}: Props) {
  const [position, setPosition] = useState(50)
  const containerRef = useRef<HTMLDivElement>(null)

  const updateFromClientX = useCallback((clientX: number) => {
    const el = containerRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const x = Math.min(Math.max(clientX - rect.left, 0), rect.width)
    setPosition((x / rect.width) * 100)
  }, [])

  const onPointerDown = (e: React.PointerEvent) => {
    e.currentTarget.setPointerCapture(e.pointerId)
    updateFromClientX(e.clientX)
  }

  const onPointerMove = (e: React.PointerEvent) => {
    if (!e.currentTarget.hasPointerCapture(e.pointerId)) return
    updateFromClientX(e.clientX)
  }

  return (
    <figure className="drag-scrubber">
      <div
        ref={containerRef}
        className="drag-scrubber__frame"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        role="group"
        aria-label="Before and after comparison — drag to compare"
      >
        <span className="drag-scrubber__tag drag-scrubber__tag--before">
          {beforeLabel}
        </span>
        <span className="drag-scrubber__tag drag-scrubber__tag--after">
          {afterLabel}
        </span>
        <img
          className="drag-scrubber__img drag-scrubber__img--after"
          src={afterSrc}
          alt={afterAlt}
          loading="lazy"
          draggable={false}
        />
        <div
          className="drag-scrubber__before-clip"
          style={{ clipPath: `inset(0 ${100 - position}% 0 0)` }}
        >
          <img
            className="drag-scrubber__img drag-scrubber__img--before"
            src={beforeSrc}
            alt={beforeAlt}
            loading="lazy"
            draggable={false}
          />
        </div>
        <div
          className="drag-scrubber__divider"
          style={{ left: `${position}%` }}
          aria-hidden
        />
        <div
          className="drag-scrubber__handle"
          style={{ left: `${position}%` }}
          aria-hidden
        >
          <span className="drag-scrubber__arrows">‹ ›</span>
        </div>
      </div>
      {caption ? (
        <figcaption className="drag-scrubber__caption">{caption}</figcaption>
      ) : null}
    </figure>
  )
}
