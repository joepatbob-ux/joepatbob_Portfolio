'use client'

import { ChapterViewport } from '@/components/ChapterViewport'

interface Props {
  sectionId: string
  eyebrow: string
  headline: string
  body: string
}

export function CaseStudyOverview({ sectionId, eyebrow, headline, body }: Props) {
  return (
    <ChapterViewport
      chapterId={`${sectionId}-overview`}
      className="case-study-overview"
      fillViewport
      style={{ borderTop: 'none' }}
    >
      <div className="case-study-overview__inner">
        {eyebrow ? (
          <p className="case-study-overview__eyebrow">{eyebrow}</p>
        ) : null}
        <h2 className="case-study-overview__headline">{headline}</h2>
        <div className="case-study-overview__rule" aria-hidden />
        <p className="case-study-overview__body">{body}</p>
      </div>
    </ChapterViewport>
  )
}
