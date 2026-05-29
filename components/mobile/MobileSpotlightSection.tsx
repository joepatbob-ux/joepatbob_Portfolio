'use client'

import { FlowChapterSlideLayout } from '@/components/chapter-slide/FlowChapterSlideLayout'
import { SpotlightPhone } from '@/components/mobile/SpotlightPhone'
import {
  MobileLabelGrid,
  MobileProse,
  MobileSectionHeader,
  splitParagraphs,
} from '@/components/mobile/MobileSectionParts'
import { MOBILE_SPOTLIGHT, mobileChapterId } from '@/lib/mobile/content'

export function MobileSpotlightSection() {
  const chapterId = mobileChapterId('spotlight')
  const paragraphs = splitParagraphs(MOBILE_SPOTLIGHT.body)

  return (
    <FlowChapterSlideLayout
      chapterId={chapterId}
      fillViewport
      className="mobile-chapter-slot mobile-chapter-slot--spotlight"
      stage={<SpotlightPhone />}
      copy={
        <>
          <MobileSectionHeader
            headline={MOBILE_SPOTLIGHT.headline}
            meta={MOBILE_SPOTLIGHT.meta}
          />
          <MobileProse paragraphs={paragraphs} />
          <MobileLabelGrid items={MOBILE_SPOTLIGHT.decisions} columns={2} />
        </>
      }
    />
  )
}
