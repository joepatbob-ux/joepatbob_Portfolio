// components/Hero.tsx
'use client'

import Image from 'next/image'
import { useTheme } from '@/components/ThemeProvider'

// Hero = one dynamic viewport tall (dvh avoids mobile 100vh drift). Breaks out
// of .content-area to full viewport width; portrait scales inside (contain).

const PORTRAIT_LIGHT = '/images/PortraitLight_MG_3496.jpg'
const PORTRAIT_DARK = '/images/PortraitDark_MG_3490.jpg'

const HERO_BG_LIGHT = '#f4f4f4'
const HERO_BG_DARK = '#191919'

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
        height: '100dvh',
        minHeight: '100dvh',
        maxHeight: '100dvh',
        overflow: 'hidden',
        backgroundColor: heroBg,
        marginLeft:
          'calc(-1 * (var(--sidebar-width) + var(--content-pad-x)))',
        marginRight: 'calc(-1 * var(--content-pad-x))',
        width: '100vw',
        maxWidth: '100vw',
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          minHeight: 0,
        }}
      >
        <Image
          key={portraitSrc}
          src={portraitSrc}
          alt="Joseph Patrick Roberts"
          fill
          priority
          sizes="100vw"
          style={{
            objectFit: 'contain',
            objectPosition: 'right bottom',
          }}
        />
      </div>
    </section>
  )
}
