'use client'

import { useCallback, useRef, useState } from 'react'

interface Props {
  beforeSrc: string
  afterSrc: string
  beforeAlt: string
  afterAlt: string
}

export function BeforeAfterSlider({
  beforeSrc,
  afterSrc,
  beforeAlt,
  afterAlt,
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

  const afterStyle: React.CSSProperties = {
    position: 'absolute',
    inset: 0,
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    objectPosition: 'top center',
    display: 'block',
  }

  const beforeStyle: React.CSSProperties = {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    objectPosition: 'top center',
    display: 'block',
  }

  return (
    <div
      ref={containerRef}
      style={{
        position: 'relative',
        width: '100%',
        maxWidth: 360,
        aspectRatio: '9 / 19.5',
        overflow: 'hidden',
        borderRadius: 24,
        userSelect: 'none',
        touchAction: 'none',
        cursor: 'ew-resize',
      }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      role="group"
      aria-label="Before and after comparison"
    >
      <img src={afterSrc} alt={afterAlt} draggable={false} style={afterStyle} />
      <div
        style={{
          position: 'absolute',
          inset: 0,
          clipPath: `inset(0 ${100 - position}% 0 0)`,
        }}
      >
        <img src={beforeSrc} alt={beforeAlt} draggable={false} style={beforeStyle} />
      </div>
      <div
        aria-hidden
        style={{
          position: 'absolute',
          top: 0,
          bottom: 0,
          left: `${position}%`,
          width: 2,
          marginLeft: -1,
          background: '#fff',
          boxShadow: '0 0 8px rgba(0,0,0,0.35)',
        }}
      />
      <div
        aria-hidden
        style={{
          position: 'absolute',
          top: '50%',
          left: `${position}%`,
          transform: 'translate(-50%, -50%)',
          width: 36,
          height: 36,
          borderRadius: '50%',
          background: '#fff',
          boxShadow: '0 2px 12px rgba(0,0,0,0.25)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'var(--font-mono)',
          fontSize: 14,
          color: 'var(--color-ink)',
        }}
      >
        ↔
      </div>
    </div>
  )
}
