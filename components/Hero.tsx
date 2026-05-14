// components/Hero.tsx
'use client'

import Image from 'next/image'
import { useTheme } from '@/components/ThemeProvider'

// The hero section is 100vh.
// The sidebar reads the hero height to calculate scroll thresholds.
// Full-bleed portrait behind copy; scrim keeps type readable on both themes.
// The name in the sidebar mirrors this and blurs out as user scrolls.

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
        display: 'flex',
        alignItems: 'flex-end',
        overflow: 'hidden',
        backgroundColor: 'var(--color-paper)',
      }}
    >
      {/* Full-bleed portrait (within content area next to fixed sidebar) */}
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
          sizes="(min-width: 901px) calc(100vw - 400px), 100vw"
          style={{
            objectFit: 'cover',
            objectPosition: 'center top',
          }}
        />
      </div>

      {/* Readability scrim — follows light/dark paper */}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          inset: 0,
          zIndex: 1,
          pointerEvents: 'none',
          background:
            'linear-gradient(105deg, var(--color-paper) 0%, color-mix(in srgb, var(--color-paper) 55%, transparent) 42%, transparent 72%)',
        }}
      />

      {/* Left content */}
      <div style={{
        position: 'relative',
        zIndex: 2,
        padding: '0 0 64px 72px',
        maxWidth: 'min(560px, 92%)',
      }}>
        {/* Eyebrow — "Hello, I am" in accent */}
        <p style={{
          fontFamily: 'var(--font-ahg)',
          fontWeight: 700,
          fontSize: 'clamp(14px, 1.5vw, 24px)',
          lineHeight: 1.4,
          textTransform: 'uppercase',
          color: 'var(--color-accent)',
          marginBottom: 12,
          letterSpacing: 0,
        }}>
          Hello, I am
        </p>

        {/* Name — large, uppercase */}
        <h1 style={{
          fontFamily: 'var(--font-ahg)',
          fontWeight: 700,
          fontSize: 'clamp(48px, 6.5vw, 120px)',
          lineHeight: 0.88,
          letterSpacing: '-0.02em',
          textTransform: 'uppercase',
          color: 'var(--color-ink)',
          margin: 0,
        }}>
          JOSEPH
          <br />
          PATRICK
          <br />
          ROBERTS
          <span style={{ color: 'var(--color-accent)' }}>.</span>
        </h1>

        {/* Descriptor sentence */}
        <p style={{
          fontFamily: 'var(--font-ahg)',
          fontWeight: 700,
          fontSize: 'clamp(14px, 1.25vw, 20px)',
          lineHeight: 1.5,
          textTransform: 'uppercase',
          color: 'var(--color-muted)',
          marginTop: 32,
          maxWidth: 360,
        }}>
          I design complex systems for hardware,
          mobile, web apps, and everything in between.
        </p>
      </div>
    </section>
  )
}
