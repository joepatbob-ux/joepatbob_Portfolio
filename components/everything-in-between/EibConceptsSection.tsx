'use client'

import { ConceptQuoteBowl } from '@/components/everything-in-between/ConceptQuoteBowl'
import { FlowChapterSlideLayout } from '@/components/chapter-slide/FlowChapterSlideLayout'
import { ChapterCopyReveal } from '@/components/chapter-slide/ChapterCopyReveal'
import {
  EibSubSectionIntro,
  splitParagraphs,
} from '@/components/everything-in-between/EibSectionParts'
import {
  EIB_CONCEPTS,
  eibChapterId,
} from '@/lib/everything-in-between/content'

export function EibConceptsSection() {
  const chapterId = eibChapterId('concepts')

  return (
    <FlowChapterSlideLayout
      chapterId={chapterId}
      fillViewport
      className="mobile-chapter-slot eib-section-slot eib-section-slot--concepts flow-chapter-slide--concepts"
      stageAriaLabel="Concept quote bowl — UX principle answers"
      stage={
        <ConceptQuoteBowl
          chapterId={chapterId}
          answers={EIB_CONCEPTS.answers}
        />
      }
      copy={
        <ChapterCopyReveal headline={EIB_CONCEPTS.headline}>
          <EibSubSectionIntro>
            {splitParagraphs(EIB_CONCEPTS.intro).map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </EibSubSectionIntro>
        </ChapterCopyReveal>
      }
    />
  )
}
