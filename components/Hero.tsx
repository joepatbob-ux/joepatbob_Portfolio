'use client'

import { applyHeroPinFade } from '@/lib/heroScroll'
import { LAYOUT_MQ } from '@/lib/layout/breakpoints'
import { getLayoutViewportHeight } from '@/lib/mobileViewport'
import { getDocumentScrollY } from '@/lib/documentScrollY'
import { useLayoutMobile } from '@/lib/hooks/useLayoutMobile'
import { useMobileHeroViewport } from '@/lib/useMobileHeroViewport'
import { scheduleScrollFrame } from '@/lib/scrollFrame'
import { useEffect } from 'react'
import { useTheme } from '@/components/ThemeProvider'

const PORTRAIT_LIGHT = '/images/PortraitLight_MG_3496-optimized.jpg'
const PORTRAIT_DARK = '/images/PortraitDark_MG_3490-optimized.jpg'

export function Hero() {
  const { resolvedTheme } = useTheme()
  const isMobile = useLayoutMobile()
  const portraitSrc =
    resolvedTheme === 'dark' ? PORTRAIT_DARK : PORTRAIT_LIGHT

  useMobileHeroViewport()

  useEffect(() => {
    const hero = document.getElementById('hero')
    if (!hero) return
    const portrait = hero.querySelector<HTMLElement>('.hero-portrait')
    const pin = hero.querySelector<HTMLElement>('.hero-pin')
    portrait?.style.removeProperty('opacity')
    portrait?.style.removeProperty('filter')
    portrait?.style.removeProperty('transform')
    portrait?.style.removeProperty('object-position')
    portrait?.style.removeProperty('visibility')
    pin?.style.removeProperty('transform')
    pin?.style.removeProperty('opacity')
    pin?.style.removeProperty('filter')
    pin?.style.removeProperty('visibility')

    return scheduleScrollFrame(() => {
      const pinEl = document.querySelector<HTMLElement>('#hero .hero-pin')
      const topBarNav = window.matchMedia(LAYOUT_MQ.topBarNav).matches
      const viewportH = getLayoutViewportHeight() || window.innerHeight
      applyHeroPinFade(
        pinEl,
        getDocumentScrollY(),
        viewportH,
        topBarNav ? 0 : 10,
      )
    })
  }, [resolvedTheme])

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
          {!isMobile ? (
            <>
              <img
                className="hero-portrait"
                src={portraitSrc}
                alt="Joseph Patrick Roberts"
                width={3200}
                height={2560}
                sizes="100vw"
                decoding="async"
                fetchPriority="high"
                draggable={false}
              />
              <div
                className={`hero-mobile-scrim hero-mobile-scrim--${resolvedTheme}`}
                aria-hidden
              />
            </>
          ) : null}
        </div>
      </div>
    </section>
  )
}
