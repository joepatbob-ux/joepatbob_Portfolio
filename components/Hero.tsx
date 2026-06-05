'use client'

import { applyHeroPinFade } from '@/lib/heroScroll'
import { LAYOUT_MQ } from '@/lib/layout/breakpoints'
import { scheduleScrollFrame } from '@/lib/scrollFrame'
import { useEffect } from 'react'
import { useTheme } from '@/components/ThemeProvider'

const PORTRAIT_LIGHT = '/images/PortraitLight_MG_3496.jpg'
const PORTRAIT_DARK = '/images/PortraitDark_MG_3490.jpg'

export function Hero() {
  const { resolvedTheme } = useTheme()
  const portraitSrc =
    resolvedTheme === 'dark' ? PORTRAIT_DARK : PORTRAIT_LIGHT

  useEffect(() => {
    const hero = document.getElementById('hero')
    if (!hero) return
    const portrait = hero.querySelector<HTMLElement>('.hero-portrait')
    const pin = hero.querySelector<HTMLElement>('.hero-pin')
    portrait?.style.removeProperty('opacity')
    portrait?.style.removeProperty('filter')
    portrait?.style.removeProperty('transform')
    portrait?.style.removeProperty('object-position')
    pin?.style.removeProperty('transform')

    if (window.matchMedia(LAYOUT_MQ.topBarNav).matches) return

    return scheduleScrollFrame(() => {
      const pinEl = document.querySelector<HTMLElement>('#hero .hero-pin')
      const topBarNav = window.matchMedia(LAYOUT_MQ.topBarNav).matches
      applyHeroPinFade(
        pinEl,
        window.scrollY,
        window.innerHeight,
        topBarNav ? 0 : 10,
      )
    })
  }, [])

  useEffect(() => {
    const hero = document.getElementById('hero')
    if (!hero) return
    const pin = hero.querySelector<HTMLElement>('.hero-pin')
    pin?.style.removeProperty('opacity')
    pin?.style.removeProperty('filter')
    pin?.style.removeProperty('visibility')
    pin?.style.removeProperty('pointer-events')
  }, [resolvedTheme])

  return (
    <section id="hero" className="hero">
      <div className="hero-pin">
        <div className="hero-media">
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
      </div>
    </section>
  )
}
