// components/Hero.tsx
'use client'

import Image from 'next/image'
import { useTheme } from '@/components/ThemeProvider'

// The hero section is 100vh — portrait only (intro copy lives in the fixed sidebar).
// Portrait spans the full viewport width, anchored right. Scrim keeps the sidebar
// legible over the photo. Breakout math matches .content-area horizontal padding.

const PORTRAIT_LIGHT = '/images/PortraitLight_MG_3496.jpg'
const PORTRAIT_DARK = '/images/PortraitDark_MG_3490.jpg'

export function Hero() {
  const { resolvedTheme } = useTheme()
  const portraitSrc =
    resolvedTheme === 'dark' ? PORTRAIT_DARK : PORTRAIT_LIGHT

  return (
    <section
      id="hero"
      style={{
        position: 'relative',
        height: '100vh',
        minHeight: 600,
        overflow: 'hidden',
        backgroundColor: 'var(--color-paper)',
        marginLeft:
          'calc(-1 * (var(--sidebar-width) + var(--content-pad-x)))',
        width: '100vw',
        maxWidth: '100vw',
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          zIndex: 0,
        }}
      >
        <Image
          src={portraitSrc}
          alt="Joseph Patrick Roberts"
          fill
          priority
          sizes="100vw"
          style={{
            objectFit: 'cover',
            objectPosition: 'right top',
          }}
        />
      </div>

      {/* Light scrim on the left so fixed sidebar type stays readable */}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          inset: 0,
          zIndex: 1,
          pointerEvents: 'none',
          background:
            'linear-gradient(105deg, var(--color-paper) 0%, color-mix(in srgb, var(--color-paper) 45%, transparent) 38%, transparent 62%)',
        }}
      />
    </section>
  )
}
