// components/CaseStudy.tsx
import type { Section } from '@/lib/types'
import { Chapter } from './Chapter'

interface Props {
  section: Section
  sectionId: string
}

export function CaseStudy({ section, sectionId }: Props) {
  return (
    <article
      data-section-id={sectionId}
      style={{ backgroundColor: 'var(--color-paper)' }}
    >
      {/* ── HEADER ── */}
      <header style={{
        padding: '56px 72px 48px',
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
        padding: '48px 72px 56px',
        borderBottom: '1px solid var(--color-rule)',
        display: 'grid',
        gridTemplateColumns: '380px 1fr',
        gap: 64,
        alignItems: 'start',
      }}>
        <div>
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
          padding: '48px 72px 72px',
          display: 'grid',
          gridTemplateColumns: '320px 1fr',
          gap: 64,
          alignItems: 'start',
        }}
      >
        <h3 style={{
          fontFamily: 'var(--font-ahg)',
          fontWeight: 700,
          fontSize: 28,
          lineHeight: 1.15,
          color: 'var(--color-ink)',
          margin: 0,
          whiteSpace: 'pre-line',
        }}>
          {section.lessonTitle}
        </h3>
        <p style={{
          fontSize: 14,
          lineHeight: 1.7,
          color: 'var(--color-muted)',
          margin: 0,
          whiteSpace: 'pre-line',
        }}>
          {section.lessonBody}
        </p>
      </div>
    </article>
  )
}
