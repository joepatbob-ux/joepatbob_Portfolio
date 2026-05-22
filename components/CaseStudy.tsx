// components/CaseStudy.tsx
import type { Section } from '@/lib/types'
import { Fragment } from 'react'
import { CaseStudyOverview } from './CaseStudyOverview'
import { Chapter } from './Chapter'
import { ChapterViewport } from './ChapterViewport'
import { ClosingQuote } from './ClosingQuote'
import { SectionLessons } from './SectionLessons'
import { WebAppsScratchReveal } from './WebAppsScratchReveal'

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
        sectionId={sectionId}
        eyebrow={section.eyebrow}
        headline={section.headline}
        body={section.overviewBody}
      />

      {section.chapters.map((chapter, i) => (
        <Fragment key={chapter.id}>
          <Chapter
            chapter={chapter}
            sectionId={sectionId}
            isLast={i === section.chapters.length - 1}
          />
          {sectionId === 'web-apps' && chapter.id === 'problem' ? (
            <ChapterViewport
              chapterId={`${sectionId}-scratch-reveal`}
              fillViewport
              className="web-apps-scratch-slot"
            >
              <WebAppsScratchReveal />
            </ChapterViewport>
          ) : null}
        </Fragment>
      ))}

      <SectionLessons
        sectionId={sectionId}
        lessonTitle={section.lessonTitle}
        lessonBody={section.lessonBody}
        isLast={!section.closingQuote}
      />

      {section.closingQuote ? (
        <ChapterViewport
          chapterId={`${sectionId}-closing`}
          isLast
          fillViewport
          className="portfolio-chapter-slot--closing"
        >
          <ClosingQuote
            quote={section.closingQuote.quote}
            attribution={section.closingQuote.attribution}
          />
        </ChapterViewport>
      ) : null}
    </article>
  )
}
