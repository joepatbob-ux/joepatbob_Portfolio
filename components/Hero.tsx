'use client'

import { useCallback, useRef } from 'react'
import { useTheme } from '@/components/ThemeProvider'
import { useHandedness } from '@/components/HandednessProvider'

const PORTRAIT_LIGHT = '/images/PortraitLight_MG_3496.jpg'
const PORTRAIT_DARK = '/images/PortraitDark_MG_3490.jpg'

const MOBILE_MAX_W = 767
const HAND_SWIPE_X = 72

export function Hero() {
  const { resolvedTheme } = useTheme()
  const { handedness, setHandedness } = useHandedness()
  const portraitSrc =
    resolvedTheme === 'dark' ? PORTRAIT_DARK : PORTRAIT_LIGHT

  const touchStartRef = useRef<{ x: number; y: number } | null>(null)

  const onHeroTouchStart = useCallback((e: React.TouchEvent) => {
    if (typeof window === 'undefined' || window.innerWidth > MOBILE_MAX_W) return
    const t = e.touches[0]
    if (!t) return
    touchStartRef.current = { x: t.clientX, y: t.clientY }
  }, [])

  const onHeroTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      if (typeof window === 'undefined' || window.innerWidth > MOBILE_MAX_W) return
      const start = touchStartRef.current
      touchStartRef.current = null
      if (!start) return
      const t = e.changedTouches[0]
      if (!t) return
      const dx = t.clientX - start.x
      const dy = t.clientY - start.y
      if (Math.abs(dy) >= Math.abs(dx) * 1.12) return
      if (dx <= -HAND_SWIPE_X) setHandedness('left')
      else if (dx >= HAND_SWIPE_X) setHandedness('right')
    },
    [setHandedness],
  )

  return (
    <section
      id="hero"
      className={`hero hero--hand-${handedness}`}
      onTouchStart={onHeroTouchStart}
      onTouchEnd={onHeroTouchEnd}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        className="hero-portrait"
        src={portraitSrc}
        alt="Joseph Patrick Roberts"
        decoding="async"
        fetchPriority="high"
        draggable={false}
      />
      <div
        className={`hero-mobile-scrim hero-mobile-scrim--${resolvedTheme}`}
        aria-hidden
      />
    </section>
  )
}
