'use client'

import { ConceptQuoteBowl } from '@/components/everything-in-between/ConceptQuoteBowl'
import { FlowChapterSlideLayout } from '@/components/chapter-slide/FlowChapterSlideLayout'
import { ChapterCopyReveal } from '@/components/chapter-slide/ChapterCopyReveal'
import {
  EibSubSectionIntro,
  splitParagraphs,
} from '@/components/everything-in-between/EibSectionParts'
import {
  EIB_CONVICTION,
  eibChapterId,
} from '@/lib/everything-in-between/content'

export function EibConvictionSection() {
  const chapterId = eibChapterId('conviction')

  return (
    <FlowChapterSlideLayout
      chapterId={chapterId}
      fillViewport
      className="mobile-chapter-slot eib-section-slot eib-section-slot--conviction flow-chapter-slide--conviction"
      stage={<ConceptQuoteBowl answers={EIB_CONVICTION.answers} />}
      copy={
        <ChapterCopyReveal headline={EIB_CONVICTION.headline}>
          <EibSubSectionIntro>
            {splitParagraphs(EIB_CONVICTION.intro).map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </EibSubSectionIntro>
        </ChapterCopyReveal>
      }
    />
  )
}
