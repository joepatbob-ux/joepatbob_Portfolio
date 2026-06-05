// components/CaseStudy.tsx
import type { Section } from '@/lib/types'
import { Fragment } from 'react'
import { insertsAfterChapter } from '@/lib/chapterInserts'
import { LazySectionChapter } from './case-study/LazySectionChapter'
import { CaseStudyFlowOverview } from '@/components/case-study/CaseStudyFlowOverview'
import { Chapter } from './Chapter'
import { ChapterInsertSlide } from './chapter-registry'
import { ChapterViewport } from './ChapterViewport'
import { ClosingQuote } from './ClosingQuote'
import { SectionLessons } from './SectionLessons'

interface Props {
  section: Section
  sectionId: string
}

/** Paper fills the viewport; padding matches `.content-area` (sidebar + content-pad-*). */
const articleFullBleed: React.CSSProperties = {
  boxSizing: 'border-box',
  marginLeft:
    'calc(-1 * (var(--sidebar-width) + var(--content-pad-left, var(--content-pad-x))))',
  marginRight: 'calc(-1 * var(--content-pad-x))',
  width:
    'calc(100% + var(--sidebar-width) + var(--content-pad-left, var(--content-pad-x)) + var(--content-pad-x))',
  paddingLeft:
    'calc(var(--sidebar-width) + var(--content-pad-left, var(--content-pad-x)))',
  paddingRight: 'var(--content-pad-x)',
}

export function CaseStudy({ section, sectionId }: Props) {
  const isMobileSection = sectionId === 'mobile'
  const isWebAppsSection = sectionId === 'web-apps'
  const isEibSection = sectionId === 'everything-else'
  const useCustomChapter =
    isMobileSection || isWebAppsSection || isEibSection

  return (
    <article
      data-section-id={sectionId}
      style={{
        ...articleFullBleed,
        backgroundColor: 'var(--color-paper)',
        minWidth: 0,
      }}
    >
      {useCustomChapter ? null : (
        <CaseStudyFlowOverview
          chapterId={`${sectionId}-overview`}
          headline={section.headline}
          body={section.overviewBody}
        />
      )}

      {isMobileSection ? (
        <LazySectionChapter sectionId="mobile" />
      ) : isWebAppsSection ? (
        <LazySectionChapter sectionId="web-apps" />
      ) : isEibSection ? (
        <LazySectionChapter sectionId="everything-else" />
      ) : (
        section.chapters.map((chapter, i) => (
          <Fragment key={chapter.id}>
            <Chapter
              chapter={chapter}
              sectionId={sectionId}
              isLast={i === section.chapters.length - 1}
            />
            {insertsAfterChapter(sectionId, chapter.id).map((insert) => (
              <ChapterInsertSlide
                key={insert.insertId}
                sectionId={sectionId}
                insert={insert}
              />
            ))}
          </Fragment>
        ))
      )}

      {section.lessonTitle?.trim() &&
      (isMobileSection || !useCustomChapter) ? (
        <SectionLessons
          sectionId={sectionId}
          lessonTitle={section.lessonTitle}
          lessonBody={section.lessonBody}
          isLast={!section.closingQuote}
        />
      ) : null}

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
