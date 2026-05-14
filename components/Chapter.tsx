// components/Chapter.tsx
import type { Chapter as ChapterType } from '@/lib/types'

interface Props {
  chapter: ChapterType
  sectionId: string
  index: number
  isLast: boolean
}

export function Chapter({ chapter, sectionId, index, isLast }: Props) {
  const chapterId = `${sectionId}-${chapter.id}`
  const num = String(index + 1).padStart(2, '0')
  const isFullWidth = chapter.imageLayout === 'full-width'
  const isPortrait  = chapter.imageLayout === 'portrait'
  const imgRight    = chapter.imagePosition === 'right'

  // Image dimensions by layout type
  const imgW = isPortrait ? 360 : 520
  const imgH = isPortrait ? 560 : isFullWidth ? 460 : 380
  const textW = isFullWidth ? '100%' : `calc(100% - ${imgW}px - 56px)`

  return (
    <section
      data-chapter-id={chapterId}
      style={{
        padding: '48px 72px 56px',
        borderTop: '1px solid var(--color-rule)',
        borderBottom: isLast ? '1px solid var(--color-rule)' : undefined,
      }}
    >
      {/* Title row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 6 }}>
        <span style={{
          fontFamily: 'var(--font-mono)',
          fontWeight: 700,
          fontSize: 11,
          color: 'var(--color-muted)',
          letterSpacing: '0.06em',
          flexShrink: 0,
        }}>
          {num}
        </span>
        <h3 style={{
          fontFamily: 'var(--font-ahg)',
          fontWeight: 700,
          fontSize: 'clamp(22px, 2vw, 32px)',
          lineHeight: 1.1,
          letterSpacing: '-0.01em',
          textTransform: 'uppercase',
          color: 'var(--color-ink)',
          margin: 0,
        }}>
          {chapter.title}
        </h3>
      </div>

      {/* Subtitle */}
      <p style={{
        fontFamily: 'var(--font-mono)',
        fontSize: 13,
        fontWeight: 700,
        color: 'var(--color-muted)',
        marginBottom: 28,
        letterSpacing: '0.01em',
      }}>
        {chapter.subtitle}
      </p>

      {/* Full-width layout: image above body */}
      {isFullWidth && (
        <>
          <ImagePlaceholder
            src={chapter.imageSrc}
            alt={chapter.imageAlt}
            width="100%"
            height={imgH}
            style={{ marginBottom: 28 }}
          />
          <p style={{
            fontSize: 14,
            lineHeight: 1.7,
            color: 'var(--color-muted)',
            maxWidth: 860,
            margin: 0,
            whiteSpace: 'pre-line',
          }}>
            {chapter.body}
          </p>
        </>
      )}

      {/* Side-by-side layout */}
      {!isFullWidth && (
        <div style={{
          display: 'flex',
          gap: 56,
          alignItems: 'flex-start',
          flexDirection: imgRight ? 'row' : 'row',
        }}>
          {!imgRight && (
            <ImagePlaceholder
              src={chapter.imageSrc}
              alt={chapter.imageAlt}
              width={imgW}
              height={imgH}
              style={{ flexShrink: 0 }}
            />
          )}
          <p style={{
            fontSize: 14,
            lineHeight: 1.7,
            color: 'var(--color-muted)',
            margin: 0,
            flex: 1,
            whiteSpace: 'pre-line',
          }}>
            {chapter.body}
          </p>
          {imgRight && (
            <ImagePlaceholder
              src={chapter.imageSrc}
              alt={chapter.imageAlt}
              width={imgW}
              height={imgH}
              style={{ flexShrink: 0 }}
            />
          )}
        </div>
      )}
    </section>
  )
}

// ── Image with placeholder fallback ──────────────────────────────────────────

function ImagePlaceholder({
  src, alt, width, height, style
}: {
  src?: string
  alt: string
  width: number | string
  height: number
  style?: React.CSSProperties
}) {
  if (src) {
    return (
      <img
        src={src}
        alt={alt}
        style={{
          width: typeof width === 'number' ? width : '100%',
          height,
          objectFit: 'cover',
          display: 'block',
          ...style,
        }}
      />
    )
  }

  // Placeholder — shows until real image is placed
  return (
    <div
      aria-label={alt}
      role="img"
      style={{
        width: typeof width === 'number' ? width : '100%',
        height,
        backgroundColor: 'rgba(0,0,0,0.06)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        position: 'relative',
        overflow: 'hidden',
        ...style,
      }}
    >
      {/* Diagonal cross lines */}
      <svg
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
        preserveAspectRatio="none"
      >
        <line x1="0" y1="0" x2="100%" y2="100%" stroke="rgba(0,0,0,0.12)" strokeWidth="1" />
        <line x1="100%" y1="0" x2="0" y2="100%" stroke="rgba(0,0,0,0.12)" strokeWidth="1" />
      </svg>
      <span style={{
        fontFamily: 'var(--font-mono)',
        fontSize: 10,
        letterSpacing: '0.06em',
        textTransform: 'uppercase',
        color: 'rgba(0,0,0,0.25)',
        position: 'relative',
        zIndex: 1,
      }}>
        {alt}
      </span>
    </div>
  )
}
