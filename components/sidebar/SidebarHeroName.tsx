import { ACCENT, FONT_AHG, INK } from '@/components/sidebar/constants'

/**
 * "Hello, I am / JOSEPH PATRICK ROBERTS." — rendered in the desktop sidebar
 * and again in the mobile hero, at different scales.
 */
export function SidebarHeroName({ variant }: { variant: 'desktop' | 'mobile' }) {
  const isMobile = variant === 'mobile'
  return (
    <>
      <div
        style={{
          fontFamily: FONT_AHG,
          fontWeight: 700,
          fontSize: isMobile
            ? 'clamp(12px, 4.2vw, 28px)'
            : 'clamp(12px, 1.35vw, 28px)',
          lineHeight: 1.1,
          textTransform: 'uppercase',
          color: ACCENT,
          marginBottom: 8,
          ...(isMobile ? { width: 'min(100%, 380px)' } : null),
        }}
      >
        Hello, I am
      </div>
      <div
        className={isMobile ? undefined : 'sidebar-hero-name__display'}
        style={{
          fontFamily: FONT_AHG,
          fontWeight: 700,
          /* Preferred scales with width; vh ceiling ≈ half viewport minus eyebrow (3 lines × lh 0.82). */
          fontSize: isMobile
            ? 'clamp(36px, min(13vw, calc((42dvh - 100px) / 2.46)), 132px)'
            : 'clamp(40px, min(7.5vw, calc((50dvh - 56px) / 2.46)), 240px)',
          lineHeight: 0.82,
          letterSpacing: '-0.02em',
          textTransform: 'uppercase',
          color: INK,
          ...(isMobile ? { marginBottom: 16, width: 'min(100%, 380px)' } : null),
        }}
      >
        <div>JOSEPH</div>
        <div>PATRICK</div>
        <div>
          ROBERTS<span style={{ color: ACCENT }}>.</span>
        </div>
      </div>
    </>
  )
}
