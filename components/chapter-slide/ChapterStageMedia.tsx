import type { Chapter } from '@/lib/types'

const SIZES = {
  portrait: { w: 360, h: 560 },
  landscape: { w: 520, h: 380 },
  fullWidthMaxH: 640,
} as const

function objectPosition(
  chapter: Pick<Chapter, 'imagePosition' | 'imageLayout'>,
  fit: 'intrinsic' | 'cover-box',
): string {
  if (fit === 'intrinsic') {
    return chapter.imagePosition === 'right' ? 'right center' : 'left center'
  }
  if (chapter.imageLayout === 'full-width') return 'center center'
  return chapter.imagePosition === 'right' ? '62% center' : '38% center'
}

interface Props {
  chapter: Pick<
    Chapter,
    'imageAlt' | 'imageSrc' | 'imageLayout' | 'imagePosition'
  >
}

/** Stage media for standard case study chapters (image or placeholder). */
export function ChapterStageMedia({ chapter }: Props) {
  const isFullWidth = chapter.imageLayout === 'full-width'
  const isPortrait = chapter.imageLayout === 'portrait'
  const fit = isFullWidth ? 'intrinsic' : 'cover-box'
  const photoPos = objectPosition(chapter, fit)

  if (chapter.imageSrc) {
    if (fit === 'intrinsic') {
      return (
        <div className="chapter-stage-media chapter-stage-media--intrinsic">
          <img
            src={chapter.imageSrc}
            alt={chapter.imageAlt}
            decoding="async"
            style={{ objectPosition: photoPos }}
          />
        </div>
      )
    }

    const { w, h } = isPortrait ? SIZES.portrait : SIZES.landscape

    return (
      <div className="chapter-stage-media chapter-stage-media--cover">
        <img
          src={chapter.imageSrc}
          alt={chapter.imageAlt}
          decoding="async"
          style={{
            aspectRatio: `${w} / ${h}`,
            objectPosition: photoPos,
          }}
        />
      </div>
    )
  }

  const placeholderH = isFullWidth
    ? Math.min(SIZES.fullWidthMaxH, 220)
    : isPortrait
      ? SIZES.portrait.h
      : SIZES.landscape.h

  return (
    <div
      className="chapter-stage-media chapter-stage-media--placeholder"
      aria-label={chapter.imageAlt}
      role="img"
      style={{ minHeight: placeholderH }}
    >
      <svg preserveAspectRatio="none" aria-hidden>
        <line x1="0" y1="0" x2="100%" y2="100%" stroke="rgba(0,0,0,0.12)" strokeWidth="1" />
        <line x1="100%" y1="0" x2="0" y2="100%" stroke="rgba(0,0,0,0.12)" strokeWidth="1" />
      </svg>
      <span>{chapter.imageAlt}</span>
    </div>
  )
}
