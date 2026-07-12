import type { Section } from '@/lib/types'
import { Fragment } from 'react'
import { useContentDebug } from '@/components/ContentDebugProvider'
import { insertsAfterChapter } from '@/lib/chapterInserts'
import { DeferredChapter } from './case-study/DeferredChapter'
import { LazySectionChapter } from './case-study/LazySectionChapter'
import { CaseStudyFlowOverview } from '@/components/case-study/CaseStudyFlowOverview'
import { ChapterInsertSlide } from './chapter-registry'
import { ChapterViewport } from './ChapterViewport'
import { ClosingQuote } from './ClosingQuote'
import { SectionLessons } from './SectionLessons'

interface Props {
  sectionId: string
  /** Required for hardware (eager). Deferred custom sections load their own copy. */
  section?: Section
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
  const { patchSection } = useContentDebug()
  const resolved = section ? patchSection(section) : undefined
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
      {useCustomChapter || !resolved ? null : (
        <CaseStudyFlowOverview
          chapterId={`${sectionId}-overview`}
          headline={resolved.headline}
          body={resolved.overviewBody}
          blocks={resolved.overviewBlocks}
        />
      )}

      {isMobileSection ? (
        <LazySectionChapter sectionId="mobile" />
      ) : isWebAppsSection ? (
        <LazySectionChapter sectionId="web-apps" />
      ) : isEibSection ? (
        <LazySectionChapter sectionId="everything-else" />
      ) : resolved ? (
        resolved.chapters.map((chapter, i) => (
          <Fragment key={chapter.id}>
            <DeferredChapter
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
      ) : null}

      {resolved?.lessonTitle?.trim() &&
      (isMobileSection || !useCustomChapter) ? (
        <SectionLessons
          sectionId={sectionId}
          lessonTitle={resolved.lessonTitle}
          lessonBody={resolved.lessonBody}
          isLast={!resolved.closingQuote}
        />
      ) : null}

      {resolved?.closingQuote ? (
        <ChapterViewport
          chapterId={`${sectionId}-closing`}
          isLast
          fillViewport
          className="portfolio-chapter-slot--closing"
        >
          <ClosingQuote
            quote={resolved.closingQuote.quote}
            attribution={resolved.closingQuote.attribution}
          />
        </ChapterViewport>
      ) : null}
    </article>
  )
}
