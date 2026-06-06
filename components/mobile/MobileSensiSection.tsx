'use client'

import dynamic from 'next/dynamic'
import { FlowChapterSlideLayout } from '@/components/chapter-slide/FlowChapterSlideLayout'
import { PhoneSwapBoundary } from '@/components/phone-swap/PhoneSwapBoundary'
import { ChapterCopyReveal } from '@/components/chapter-slide/ChapterCopyReveal'
import {
  MobileLabelGrid,
  MobileProse,
  MobileSubStory,
  MobileSubStoryHeading,
  splitParagraphs,
} from '@/components/mobile/MobileSectionParts'
import { MOBILE_SENSI, mobileChapterId } from '@/lib/mobile/content'

const PhoneSwap = dynamic(
  () => import('@/components/PhoneSwap').then((m) => ({ default: m.PhoneSwap })),
  {
    loading: () => (
      <p className="phone-swap__fallback">Loading 3D preview…</p>
    ),
  },
)

export function MobileSensiSection() {
  const chapterId = mobileChapterId('sensi')
  const [color, install, spotlight] = MOBILE_SENSI.subStories
  const intro = splitParagraphs(MOBILE_SENSI.intro)

  return (
    <FlowChapterSlideLayout
      chapterId={chapterId}
      fillViewport
      className="mobile-chapter-slot mobile-chapter-slot--sensi"
      stage={
        <PhoneSwapBoundary key="phone-swap-3d">
          <PhoneSwap />
        </PhoneSwapBoundary>
      }
      copy={
        <ChapterCopyReveal headline={MOBILE_SENSI.headline}>
          <MobileProse paragraphs={intro} />
          <div className="mobile-sub-stories">
            <MobileSubStory heading={color.heading}>
              <MobileProse paragraphs={splitParagraphs(color.body)} />
              <MobileLabelGrid items={color.problems} />
            </MobileSubStory>
            <MobileSubStory heading={install.heading}>
              <MobileProse paragraphs={splitParagraphs(install.body)} />
            </MobileSubStory>
            <MobileSubStory heading={spotlight.heading}>
              <MobileProse paragraphs={splitParagraphs(spotlight.intro)} />
              <MobileLabelGrid items={spotlight.decisions} />
              <MobileSubStoryHeading heading={spotlight.testingHeading} />
              <MobileProse paragraphs={splitParagraphs(spotlight.testingBody)} />
              <MobileProse paragraphs={splitParagraphs(spotlight.closeBody)} />
            </MobileSubStory>
          </div>
        </ChapterCopyReveal>
      }
    />
  )
}
