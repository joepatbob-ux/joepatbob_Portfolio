'use client'

import { FlowChapterSlideLayout } from '@/components/chapter-slide/FlowChapterSlideLayout'
import { ChapterCopyReveal } from '@/components/chapter-slide/ChapterCopyReveal'
import { Touch2Carousel } from '@/components/touch2/Touch2Carousel'
import {
  EibPracticeClose,
  EibSubSectionIntro,
  splitParagraphs,
} from '@/components/everything-in-between/EibSectionParts'
import {
  EIB_PRACTICE,
  eibChapterId,
} from '@/lib/everything-in-between/content'
import { PRACTICE_CAROUSEL_IMAGES } from '@/lib/practiceCarouselImages'

export function EibPracticeSection() {
  const chapterId = eibChapterId('practice')

  return (
    <FlowChapterSlideLayout
      chapterId={chapterId}
      fillViewport
      isLast={false}
      className="mobile-chapter-slot eib-section-slot eib-section-slot--practice"
      stage={
        <Touch2Carousel
          slides={PRACTICE_CAROUSEL_IMAGES}
          className="eib-practice-gallery"
          ariaLabel="Practice photo gallery"
        />
      }
      copy={
        <ChapterCopyReveal headline={EIB_PRACTICE.headline}>
          <EibSubSectionIntro>
            {splitParagraphs(EIB_PRACTICE.intro).map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </EibSubSectionIntro>
          <EibPracticeClose statement={EIB_PRACTICE.close} />
        </ChapterCopyReveal>
      }
    />
  )
}
