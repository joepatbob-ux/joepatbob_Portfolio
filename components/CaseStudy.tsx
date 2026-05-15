// components/CaseStudy.tsx
import type { Section } from '@/lib/types'
import { Chapter } from './Chapter'
import { ClosingQuote } from './ClosingQuote'

interface Props {
  section: Section
  sectionId: string
}

const padHeader = 'clamp(32px, 5vw, 56px) clamp(16px, 5vw, 72px) clamp(28px, 4vw, 48px)'
const padBlock = 'clamp(32px, 5vw, 48px) clamp(16px, 5vw, 72px) clamp(36px, 5vw, 56px)'

export function CaseStudy({ section, sectionId }: Props) {
  return (
    <article
      data-section-id={sectionId}
      style={{
        backgroundColor: 'var(--color-paper)',
        minWidth: 0,
        scrollMarginTop: 24,
      }}
    >
      {/* ── HEADER ── */}
      <header style={{
        padding: padHeader,
        borderBottom: '1px solid var(--color-rule)',
      }}>
        <p style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 11,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color: 'var(--color-muted)',
          marginBottom: 16,
        }}>
          {section.eyebrow}
        </p>
        <h2 style={{
          fontFamily: 'var(--font-ahg)',
          fontWeight: 700,
          fontSize: 'clamp(32px, 3vw, 56px)',
          lineHeight: 1.05,
          letterSpacing: '-0.02em',
          textTransform: 'uppercase',
          color: 'var(--color-ink)',
          margin: 0,
          whiteSpace: 'pre-line',
        }}>
          {section.headline}
        </h2>
      </header>

      {/* ── OVERVIEW ── */}
      <div style={{
        padding: padBlock,
        borderBottom: '1px solid var(--color-rule)',
        display: 'flex',
        flexWrap: 'wrap',
        gap: 'clamp(32px, 5vw, 64px)',
        alignItems: 'start',
      }}>
        <div style={{ flex: '1 1 280px', minWidth: 0, maxWidth: '100%' }}>
          <h3 style={{
            fontFamily: 'var(--font-ahg)',
            fontWeight: 700,
            fontSize: 22,
            color: 'var(--color-ink)',
            marginBottom: 14,
          }}>
            Overview
          </h3>
          <p style={{
            fontFamily: 'var(--font-body)',
            fontSize: 14,
            lineHeight: 1.7,
            color: 'var(--color-muted)',
            margin: 0,
            whiteSpace: 'pre-line',
          }}>
            {section.overviewBody}
          </p>
        </div>
        <blockquote style={{
          fontFamily: 'var(--font-ahg)',
          fontWeight: 700,
          fontSize: 'clamp(20px, 1.8vw, 28px)',
          lineHeight: 1.4,
          color: 'rgba(13,13,13,0.45)',
          margin: 0,
          padding: 0,
          border: 'none',
          flex: '1 1 280px',
          minWidth: 0,
          maxWidth: '100%',
        }}>
          "{section.pullQuote}"
        </blockquote>
      </div>

      {/* ── CHAPTERS ── */}
      {section.chapters.map((chapter, i) => (
        <Chapter
          key={chapter.id}
          chapter={chapter}
          sectionId={sectionId}
          index={i}
          isLast={i === section.chapters.length - 1}
        />
      ))}

      {/* ── LESSONS ── */}
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
