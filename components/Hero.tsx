// components/Hero.tsx
'use client'

import Image from 'next/image'
import { useTheme } from '@/components/ThemeProvider'

// The hero section is 100vh — portrait only (intro copy lives in the fixed sidebar).
// Portrait scales to the viewport, anchored left; background matches photo matte.

const PORTRAIT_LIGHT = '/images/PortraitLight_MG_3496.jpg'
const PORTRAIT_DARK = '/images/PortraitDark_MG_3490.jpg'

const HERO_BG_LIGHT = '#f0f0f0'
const HERO_BG_DARK = '#101010'

export function Hero() {
  const { resolvedTheme } = useTheme()
  const portraitSrc =
    resolvedTheme === 'dark' ? PORTRAIT_DARK : PORTRAIT_LIGHT
  const heroBg =
    resolvedTheme === 'dark' ? HERO_BG_DARK : HERO_BG_LIGHT

  return (
    <section
      id="hero"
      style={{
        position: 'relative',
        height: '100vh',
        minHeight: 600,
        overflow: 'hidden',
        backgroundColor: heroBg,
        marginLeft:
          'calc(-1 * (var(--sidebar-width) + var(--content-pad-x)))',
        width: '100vw',
        maxWidth: '100vw',
      }}
    >
      <div style={{ position: 'absolute', inset: 0 }}>
        <Image
          src={portraitSrc}
          alt="Joseph Patrick Roberts"
          fill
          priority
          sizes="100vw"
          style={{
            objectFit: 'contain',
            objectPosition: 'left center',
          }}
        />
      </div>
    </section>
  )
}
