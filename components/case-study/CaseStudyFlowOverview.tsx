import { CaseStudyOverviewBlocks } from '@/components/case-study/CaseStudyOverviewBlocks'
import { CaseStudySectionHeader } from '@/components/case-study/CaseStudySectionHeader'
import { ChapterBodyGroups } from '@/components/chapter-slide/ChapterBodyGroups'
import { ChapterSlideBand } from '@/components/chapter-slide/ChapterSlideBand'
import {
  groupChapterBody,
  parseChapterBody,
} from '@/lib/chapter-slide/parseChapterBody'
import type { OverviewBlock } from '@/lib/types'

interface Props {
  chapterId: string
  headline: string
  body: string
  blocks?: readonly OverviewBlock[]
  subhead?: string
  align?: 'left' | 'center'
  className?: string
}

/** Section overview — same band as stage | copy chapters; full body on all breakpoints. */
export function CaseStudyFlowOverview({
  chapterId,
  headline,
  body,
  blocks,
  subhead,
  align = 'center',
  className,
}: Props) {
  const paragraphs = parseChapterBody(body)

  return (
    <ChapterSlideBand
      chapterId={chapterId}
      fillViewport
      copyOnly
      copyClassName={
        align === 'center' ? 'chapter-slide__copy--overview-center' : ''
      }
      className={[
        'mobile-chapter-slot',
        'flow-chapter-slide',
        'case-study-flow-overview',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      copy={
        <>
          <CaseStudySectionHeader
            headline={headline}
            subhead={subhead}
            align={align}
            className="case-study-flow-overview__header"
          />
          {paragraphs.length > 0 ? (
            <ChapterBodyGroups
              groups={groupChapterBody(paragraphs)}
              paragraphClass="mobile-prose__p"
            />
          ) : null}
          {blocks && blocks.length > 0 ? (
            <CaseStudyOverviewBlocks blocks={blocks} />
          ) : null}
        </>
      }
    />
  )
}
