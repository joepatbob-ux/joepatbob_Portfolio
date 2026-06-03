'use client'

import { ConceptEightBall } from '@/components/everything-in-between/ConceptEightBall'
import { FlowChapterSlideLayout } from '@/components/chapter-slide/FlowChapterSlideLayout'
import { MobileLearnMore } from '@/components/mobile/MobileLearnMore'
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
      isLast={false}
      className="mobile-chapter-slot eib-section-slot eib-section-slot--concepts flow-chapter-slide--concepts"
      stage={
        <ConceptEightBall
          answers={EIB_CONCEPTS.answers}
          prompt={EIB_CONCEPTS.prompt}
        />
      }
      copy={
        <MobileLearnMore headline={EIB_CONCEPTS.headline}>
          <EibSubSectionIntro>
            {splitParagraphs(EIB_CONCEPTS.intro).map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </EibSubSectionIntro>
        </MobileLearnMore>
      }
    />
  )
}
