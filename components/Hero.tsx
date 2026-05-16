// components/Hero.tsx
'use client'

import { useCallback, useRef } from 'react'
import { useTheme } from '@/components/ThemeProvider'
import { useHandedness } from '@/components/HandednessProvider'

// Hero = one dynamic viewport tall (dvh avoids mobile 100vh drift). Breaks out
// of .content-area to full viewport width; `.hero-portrait` uses contain (desktop)
// and cover (≤767px) via globals.css, with `--left|--right` anchor. At the mobile
// breakpoint, landscape orientation sets initial handedness until the first swipe; swipe hero left/right toggles
// and persists. `.hero-mobile-scrim` is a subtle veil over the portrait for copy contrast.
// Canvas color comes from `<html>` (see ThemeProvider + `lib/hero-canvas`).

const PORTRAIT_LIGHT = '/images/PortraitLight_MG_3496.jpg'
const PORTRAIT_DARK = '/images/PortraitDark_MG_3490.jpg'

const MOBILE_MAX_W = 767
/** Horizontal swipe distance (px) to flip handedness when gesture is mostly horizontal */
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
      onTouchStart={onHeroTouchStart}
      onTouchEnd={onHeroTouchEnd}
      style={{
        position: 'relative',
        height: '100dvh',
        minHeight: '100dvh',
        maxHeight: '100dvh',
        overflow: 'hidden',
        backgroundColor: 'transparent',
        marginLeft:
          'calc(-1 * (var(--sidebar-width) + var(--content-pad-x)))',
        marginRight: 'calc(-1 * var(--content-pad-x))',
        width: '100vw',
        maxWidth: '100vw',
      }}
    >
      <div
        className={`hero-portrait hero-portrait--${handedness}`}
        role="img"
        aria-label="Joseph Patrick Roberts"
        style={{
          position: 'absolute',
          inset: 0,
          zIndex: 0,
          width: '100%',
          height: '100%',
          minHeight: 0,
          backgroundImage: `url(${JSON.stringify(portraitSrc)})`,
          backgroundRepeat: 'no-repeat',
        }}
      />
      <div
        className={`hero-mobile-scrim hero-mobile-scrim--${resolvedTheme}`}
        aria-hidden
      />
    </section>
  )
}
