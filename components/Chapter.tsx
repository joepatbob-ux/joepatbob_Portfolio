// components/Chapter.tsx
import type { Chapter as ChapterType } from '@/lib/types'
import { BeforeAfterSlider } from '@/components/BeforeAfterSlider'
import { SensiLiteChapter } from '@/components/SensiLiteChapter'
import { Touch2Chapter } from '@/components/Touch2Chapter'
import { StickerPile } from '@/components/StickerPile'

interface Props {
  chapter: ChapterType
  sectionId: string
  index: number
  isLast: boolean
}

const padY = 'clamp(28px, 4vw, 48px)'
const padX = 'clamp(16px, 4vw, 72px)'

export function Chapter({ chapter, sectionId, index, isLast }: Props) {
  const chapterId = `${sectionId}-${chapter.id}`

  if (chapterId === 'hardware-sensi-lite') {
    return <SensiLiteChapter body={chapter.body} isLast={isLast} />
  }

  if (chapterId === 'hardware-touch-2') {
    return <Touch2Chapter chapter={chapter} index={index} isLast={isLast} />
  }

  const num = String(index + 1).padStart(2, '0')
  const isFullWidth = chapter.imageLayout === 'full-width'
  const isPortrait = chapter.imageLayout === 'portrait'
  const imgRight = chapter.imagePosition === 'right'

  // Image dimensions by layout type (max bounds; intrinsic full-width scales down)
  const imgW = isPortrait ? 360 : 520
  const imgH = isPortrait ? 560 : 380
  const fullWidthMaxH = 640

  return (
    <section
      data-chapter-id={chapterId}
      style={{
        padding: `${padY} ${padX} clamp(32px, 4vw, 56px)`,
        borderTop: '1px solid var(--color-rule)',
        borderBottom: isLast ? '1px solid var(--color-rule)' : undefined,
        minWidth: 0,
        scrollMarginTop: 24,
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
        <h3
          style={{
            fontFamily: 'var(--font-ahg)',
            fontWeight: 700,
            fontSize: 'clamp(22px, 2vw, 32px)',
            lineHeight: 1.1,
            letterSpacing: '-0.01em',
            textTransform: 'uppercase',
            color: 'var(--color-ink)',
            margin: 0,
          }}
        >
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

      {/* Full-width layout: image above body — intrinsic width, capped height */}
      {isFullWidth && (
        <>
          {chapterId === 'everything-else-in-between' && (
            <div style={{ marginBottom: 28 }}>
              <StickerPile />
            </div>
          )}
          {chapterId === 'mobile-color' && (
            <div style={{ marginBottom: 28 }}>
              <BeforeAfterSlider
                beforeSrc="/images/mobile-android-legacy-fullbleed-orange.png"
                afterSrc="/images/mobile-android-v1-dark-orange-number.png"
                beforeAlt="Legacy full-bleed orange heat mode screen"
                afterAlt="Refined UI with mode color on the temperature number"
              />
            </div>
          )}
          {chapterId !== 'mobile-color' && (
            <ImagePlaceholder
              framing={{
                imagePosition: chapter.imagePosition,
                imageLayout: chapter.imageLayout,
              }}
              src={chapter.imageSrc}
              alt={chapter.imageAlt}
              width="100%"
              height={fullWidthMaxH}
              fit="intrinsic"
              style={{ marginBottom: 28 }}
            />
          )}
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
          gap: 'clamp(24px, 4vw, 56px)',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
        }}>
          {!imgRight && (
            <ImagePlaceholder
              framing={{
                imagePosition: chapter.imagePosition,
                imageLayout: chapter.imageLayout,
              }}
              src={chapter.imageSrc}
              alt={chapter.imageAlt}
              width={imgW}
              height={imgH}
              fit="cover-box"
              style={{ flexShrink: 0 }}
            />
          )}
          <p style={{
            fontSize: 14,
            lineHeight: 1.7,
            color: 'var(--color-muted)',
            margin: 0,
            flex: '1 1 240px',
            minWidth: 0,
            whiteSpace: 'pre-line',
          }}>
            {chapter.body}
          </p>
          {imgRight && (
            <ImagePlaceholder
              framing={{
                imagePosition: chapter.imagePosition,
                imageLayout: chapter.imageLayout,
              }}
              src={chapter.imageSrc}
              alt={chapter.imageAlt}
              width={imgW}
              height={imgH}
              fit="cover-box"
              style={{ flexShrink: 0 }}
            />
          )}
        </div>
      )}
    </section>
  )
}

function chapterPhotoObjectPosition(
  framing: Pick<ChapterType, 'imagePosition' | 'imageLayout'>,
  fit: 'intrinsic' | 'cover-box',
): string {
  if (fit === 'intrinsic') {
    return framing.imagePosition === 'right' ? 'right center' : 'left center'
  }
  if (framing.imageLayout === 'full-width') return 'center center'
  return framing.imagePosition === 'right' ? '62% center' : '38% center'
}

// ── Image with placeholder fallback ──────────────────────────────────────────

function ImagePlaceholder({
  src,
  alt,
  width,
  height,
  framing,
  style,
  fit = 'cover-box',
}: {
  src?: string
  alt: string
  width: number | string
  height: number
  framing?: Pick<ChapterType, 'imagePosition' | 'imageLayout'>
  style?: React.CSSProperties
  fit?: 'cover-box' | 'intrinsic'
}) {
  const w =
    typeof width === 'number' ? `min(${width}px, 100%)` : width

  const framingResolved =
    framing ?? { imagePosition: 'left' as const, imageLayout: 'portrait' as const }

  const photoPos = chapterPhotoObjectPosition(framingResolved, fit)

  if (src) {
    if (fit === 'intrinsic') {
      return (
        <img
          src={src}
          alt={alt}
          decoding="async"
          style={{
            width: w,
            maxWidth: '100%',
            height: 'auto',
            maxHeight: height,
            objectFit: 'contain',
            objectPosition: photoPos,
            display: 'block',
            ...style,
          }}
        />
      )
    }

    return (
      <img
        src={src}
        alt={alt}
        decoding="async"
        style={{
          width: w,
          maxWidth: '100%',
          height,
          objectFit: 'cover',
          objectPosition: photoPos,
          display: 'block',
          ...style,
        }}
      />
    )
  }

  const placeholderMinH = fit === 'intrinsic' ? Math.min(height, 220) : height

  return (
    <div
      aria-label={alt}
      role="img"
      style={{
        width: w,
        maxWidth: '100%',
        height: fit === 'intrinsic' ? placeholderMinH : height,
        minHeight: fit === 'intrinsic' ? placeholderMinH : undefined,
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
