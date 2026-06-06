'use client'

import { CaseStudyOverviewMeta } from '@/components/case-study/CaseStudyOverviewMeta'
import { CaseStudySectionHeader } from '@/components/case-study/CaseStudySectionHeader'
import { ChapterSlideBand } from '@/components/chapter-slide/ChapterSlideBand'
import { formatChapterInline } from '@/lib/chapter-slide/formatChapterInline'
import { parseChapterBody } from '@/lib/chapter-slide/parseChapterBody'
import type { OverviewMetaItem } from '@/lib/types'

interface Props {
  chapterId: string
  headline: string
  body: string
  meta?: readonly OverviewMetaItem[]
  subhead?: string
  align?: 'left' | 'center'
  className?: string
}

/** Section overview — 900px column centered in content area; full body on all breakpoints. */
export function CaseStudyFlowOverview({
  chapterId,
  headline,
  body,
  meta,
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
      className={[
        'mobile-chapter-slot',
        'flow-chapter-slide',
        'case-study-flow-overview',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      copy={
        <div
          className={
            align === 'center'
              ? 'case-study-flow-overview__inner case-study-flow-overview__inner--center'
              : 'case-study-flow-overview__inner'
          }
        >
          <CaseStudySectionHeader
            headline={headline}
            subhead={subhead}
            align={align}
          />
          {paragraphs.length > 0 ? (
            <div className="mobile-prose case-study-flow-overview__prose">
              {paragraphs.map((p, i) => (
                <p key={i} className="mobile-prose__p">
                  {formatChapterInline(p)}
                </p>
              ))}
            </div>
          ) : null}
          {meta && meta.length > 0 ? <CaseStudyOverviewMeta items={meta} /> : null}
        </div>
      }
    />
  )
}
