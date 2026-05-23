'use client'

import { ChapterCopyScroller } from '@/components/ChapterCopyScroller'
import { ChapterViewport } from '@/components/ChapterViewport'
import { SpotlightPhone } from '@/components/mobile/SpotlightPhone'
import { CaseStudySplit } from '@/components/case-study/CaseStudySplit'
import {
  MobileLabelGrid,
  MobileProse,
  MobileSectionHeader,
  splitParagraphs,
} from '@/components/mobile/MobileSectionParts'
import { MOBILE_SPOTLIGHT, mobileChapterId } from '@/lib/mobile/content'
import { useCopyScrollActive } from '@/lib/useCopyScrollActive'

export function MobileSpotlightSection() {
  const chapterId = mobileChapterId('spotlight')
  const copyScrollActive = useCopyScrollActive(chapterId)
  const paragraphs = splitParagraphs(MOBILE_SPOTLIGHT.body)

  return (
    <ChapterViewport
      chapterId={chapterId}
      fillViewport
      className="mobile-chapter-slot mobile-chapter-slot--spotlight"
    >
      <ChapterCopyScroller
        active={copyScrollActive}
        className="mobile-chapter-panel__scroll"
      >
        <div className="mobile-chapter-panel__content">
          <MobileSectionHeader
            eyebrow={MOBILE_SPOTLIGHT.eyebrow}
            headline={MOBILE_SPOTLIGHT.headline}
            meta={MOBILE_SPOTLIGHT.meta}
          />
          <MobileProse paragraphs={paragraphs.slice(0, 4)} />
          <CaseStudySplit
            copy={
              <>
                <MobileLabelGrid items={MOBILE_SPOTLIGHT.decisions} columns={2} />
                <MobileProse paragraphs={paragraphs.slice(4)} />
              </>
            }
            stage={<SpotlightPhone />}
          />
        </div>
      </ChapterCopyScroller>
    </ChapterViewport>
  )
}
