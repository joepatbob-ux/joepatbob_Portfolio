// components/CaseStudy.tsx
import type { Section } from '@/lib/types'
import { CaseStudyOverview } from './CaseStudyOverview'
import { Chapter } from './Chapter'
import { ClosingQuote } from './ClosingQuote'

interface Props {
  section: Section
  sectionId: string
}

/** Paper fills the viewport; padding restores the same text column as `.content-area`. */
const articleFullBleed: React.CSSProperties = {
  boxSizing: 'border-box',
  marginLeft: 'calc(-1 * (var(--sidebar-width) + var(--content-pad-x)))',
  marginRight: 'calc(-1 * var(--content-pad-x))',
  width: 'calc(100% + var(--sidebar-width) + var(--content-pad-x) * 2)',
  paddingLeft: 'calc(var(--sidebar-width) + var(--content-pad-x))',
  paddingRight: 'var(--content-pad-x)',
}

export function CaseStudy({ section, sectionId }: Props) {
  return (
    <article
      data-section-id={sectionId}
      style={{
        ...articleFullBleed,
        backgroundColor: 'var(--color-paper)',
        minWidth: 0,
        scrollMarginTop: 24,
      }}
    >
      <CaseStudyOverview
        eyebrow={section.eyebrow}
        headline={section.headline}
        body={section.overviewBody}
      />

      {section.chapters.map((chapter, i) => (
        <Chapter
          key={chapter.id}
          chapter={chapter}
          sectionId={sectionId}
          index={i}
          isLast={i === section.chapters.length - 1}
        />
      ))}

      <div
        data-chapter-id={`${sectionId}-lessons`}
        style={{
          padding: `clamp(32px, 5vw, 48px) clamp(16px, 5vw, 72px) clamp(48px, 6vw, 72px)`,
          scrollMarginTop: 24,
          display: 'flex',
          flexWrap: 'wrap',
          gap: 'clamp(32px, 5vw, 64px)',
          alignItems: 'start',
        }}
      >
        <h3
          style={{
            fontFamily: 'var(--font-ahg)',
            fontWeight: 700,
            fontSize: 28,
            lineHeight: 1.15,
            color: 'var(--color-ink)',
            margin: 0,
            whiteSpace: 'pre-line',
            flex: '1 1 260px',
            minWidth: 0,
            maxWidth: '100%',
          }}
        >
          {section.lessonTitle}
        </h3>
        <p
          style={{
            fontSize: 14,
            lineHeight: 1.7,
            color: 'var(--color-muted)',
            margin: 0,
            whiteSpace: 'pre-line',
            flex: '1 1 280px',
            minWidth: 0,
            maxWidth: '100%',
          }}
        >
          {section.lessonBody}
        </p>
      </div>

      {section.closingQuote ? (
        <ClosingQuote
          quote={section.closingQuote.quote}
          attribution={section.closingQuote.attribution}
        />
      ) : null}
    </article>
  )
}
