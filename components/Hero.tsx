// components/Hero.tsx
'use client'

// The hero section is 100vh.
// The sidebar reads the hero height to calculate scroll thresholds.
// Portrait photo fills the right half.
// Left side: eyebrow + name stack.
// The name in the sidebar mirrors this and blurs out as user scrolls.

export function Hero() {
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
      {/* Portrait photo — right half */}
      {/* Replace src with actual portrait image */}
      <div style={{
        position: 'absolute',
        right: 0,
        top: 0,
        width: '55%',
        height: '100%',
        overflow: 'hidden',
      }}>
        <img
          src="/images/portrait.jpg"
          alt="Joseph Patrick Roberts"
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: 'center top',
          }}
        />
      </div>

      {/* Left content */}
      <div style={{
        position: 'relative',
        zIndex: 1,
        padding: '0 0 64px 72px',
        maxWidth: '45%',
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
