'use client'

import { useCallback, useEffect, useRef } from 'react'
import { useTheme } from '@/components/ThemeProvider'
import { useHandedness } from '@/components/HandednessProvider'
import { LAYOUT_BP } from '@/lib/layout/breakpoints'

const PORTRAIT_LIGHT = '/images/PortraitLight_MG_3496.jpg'
const PORTRAIT_DARK = '/images/PortraitDark_MG_3490.jpg'

const MOBILE_MAX_W = LAYOUT_BP.mobileMax
const HAND_SWIPE_X = 72

export function Hero() {
  const { resolvedTheme } = useTheme()
  const { handedness, setHandedness } = useHandedness()
  const portraitSrc =
    resolvedTheme === 'dark' ? PORTRAIT_DARK : PORTRAIT_LIGHT

  const touchStartRef = useRef<{ x: number; y: number } | null>(null)

  useEffect(() => {
    const hero = document.getElementById('hero')
    if (!hero) return
    const portrait = hero.querySelector<HTMLElement>('.hero-portrait')
    const pin = hero.querySelector<HTMLElement>('.hero-pin')
    portrait?.style.removeProperty('opacity')
    portrait?.style.removeProperty('filter')
    portrait?.style.removeProperty('transform')
    portrait?.style.removeProperty('object-position')
    pin?.style.removeProperty('opacity')
    pin?.style.removeProperty('filter')
    pin?.style.removeProperty('transform')
  }, [])

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
      <div className="hero-pin">
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
      </div>
    </section>
  )
}
