'use client'

import { CaseStudySectionHeader } from '@/components/case-study/CaseStudySectionHeader'
import { ChapterSlideBand } from '@/components/chapter-slide/ChapterSlideBand'
import { parseChapterBody } from '@/lib/chapter-slide/parseChapterBody'

interface Props {
  chapterId: string
  headline: string
  body: string
  meta?: readonly { label: string; value: string }[]
  subhead?: string
  align?: 'left' | 'center'
  className?: string
}

/** Section overview — centered 900px column in content area; full body on mobile (no sheet). */
export function CaseStudyFlowOverview({
  chapterId,
  headline,
  body,
  meta = [],
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
            meta={meta}
            subhead={subhead}
            align={align}
          />
          {paragraphs.length > 0 ? (
            <div className="mobile-prose case-study-flow-overview__prose">
              {paragraphs.map((p, i) => (
                <p key={i} className="mobile-prose__p">
                  {p}
                </p>
              ))}
            </div>
          ) : null}
        </div>
      }
    />
  )
}
