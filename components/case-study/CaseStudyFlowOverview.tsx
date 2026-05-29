'use client'

import { ChapterSlideBand } from '@/components/chapter-slide/ChapterSlideBand'
import { MobileLearnMore } from '@/components/mobile/MobileLearnMore'
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

/** Section overview — copy-only band (empty stage), same shell as other flow slides. */
export function CaseStudyFlowOverview({
  chapterId,
  headline,
  body,
  meta = [],
  subhead,
  align = 'left',
  className,
}: Props) {
  const paragraphs = parseChapterBody(body)

  return (
    <ChapterSlideBand
      chapterId={chapterId}
      fillViewport
      className={[
        'mobile-chapter-slot',
        'flow-chapter-slide',
        'case-study-flow-overview',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      stage={<div className="flow-chapter-slide__stage--empty" aria-hidden />}
      copy={
        <div
          className={
            align === 'center'
              ? 'case-study-flow-overview__inner case-study-flow-overview__inner--center'
              : 'case-study-flow-overview__inner'
          }
        >
          <MobileLearnMore
            headline={headline}
            meta={meta}
            subhead={subhead}
            align={align}
          >
            {paragraphs.length > 0 ? (
              <div className="mobile-prose case-study-flow-overview__prose">
                {paragraphs.map((p, i) => (
                  <p key={i} className="mobile-prose__p">
                    {p}
                  </p>
                ))}
              </div>
            ) : null}
          </MobileLearnMore>
        </div>
      }
    />
  )
}
