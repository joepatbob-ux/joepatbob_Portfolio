'use client'

import { ChapterCopyScroller } from '@/components/ChapterCopyScroller'
import { ChapterViewport } from '@/components/ChapterViewport'
import { CaseStudySplit } from '@/components/case-study/CaseStudySplit'
import { PhotoGallery } from '@/components/PhotoGallery'
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
import { useCopyScrollActive } from '@/lib/useCopyScrollActive'

export function EibPracticeSection() {
  const chapterId = eibChapterId('practice')
  const copyScrollActive = useCopyScrollActive(chapterId)

  return (
    <ChapterViewport
      chapterId={chapterId}
      fillViewport
      isLast={false}
      className="mobile-chapter-slot eib-section-slot eib-section-slot--practice"
    >
      <ChapterCopyScroller
        active={copyScrollActive}
        className="mobile-chapter-panel__scroll"
      >
        <div className="mobile-chapter-panel__content eib-section__content">
          <CaseStudySplit
            copy={
              <>
                <EibSubSectionIntro>
                  {splitParagraphs(EIB_PRACTICE.intro).map((p, i) => (
                    <p key={i}>{p}</p>
                  ))}
                </EibSubSectionIntro>
                <EibPracticeClose
                  statement={EIB_PRACTICE.close}
                  email={EIB_PRACTICE.email}
                  linkedIn={EIB_PRACTICE.linkedIn}
                />
              </>
            }
            stage={
              <PhotoGallery
                slides={PRACTICE_CAROUSEL_IMAGES}
                className="eib-practice-gallery"
                ariaLabel="Practice photo gallery"
              />
            }
          />
        </div>
      </ChapterCopyScroller>
    </ChapterViewport>
  )
}
