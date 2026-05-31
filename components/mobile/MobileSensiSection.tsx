'use client'

import { Suspense } from 'react'
import { PhoneSwap } from '@/components/PhoneSwap'
import { FlowChapterSlideLayout } from '@/components/chapter-slide/FlowChapterSlideLayout'
import { PhoneSwapBoundary } from '@/components/phone-swap/PhoneSwapBoundary'
import { MobileLearnMore } from '@/components/mobile/MobileLearnMore'
import {
  MobileLabelGrid,
  MobileProse,
  MobileSubStory,
  splitParagraphs,
} from '@/components/mobile/MobileSectionParts'
import { MOBILE_SENSI, mobileChapterId } from '@/lib/mobile/content'

export function MobileSensiSection() {
  const chapterId = mobileChapterId('sensi')
  const [color, install, platform] = MOBILE_SENSI.subStories
  const intro = splitParagraphs(MOBILE_SENSI.intro)

  return (
    <FlowChapterSlideLayout
      chapterId={chapterId}
      fillViewport
      className="mobile-chapter-slot mobile-chapter-slot--sensi"
      stage={
        <PhoneSwapBoundary key="phone-swap-3d">
          <Suspense
            fallback={
              <p className="phone-swap__fallback">Loading 3D preview…</p>
            }
          >
            <PhoneSwap />
          </Suspense>
        </PhoneSwapBoundary>
      }
      copy={
        <MobileLearnMore
          headline={MOBILE_SENSI.headline}
          meta={MOBILE_SENSI.meta}
        >
          <MobileProse paragraphs={intro} />
          <div className="mobile-sub-stories">
            <MobileSubStory heading={color.heading}>
              <MobileProse paragraphs={splitParagraphs(color.body)} />
              <MobileLabelGrid items={color.problems} columns={3} />
            </MobileSubStory>
            <MobileSubStory heading={install.heading}>
              <MobileProse paragraphs={splitParagraphs(install.body)} />
              <blockquote className="mobile-blockquote">
                <p>{install.quote}</p>
              </blockquote>
            </MobileSubStory>
            <MobileSubStory heading={platform.heading}>
              <MobileProse paragraphs={splitParagraphs(platform.body)} />
              <aside className="mobile-thesis-close">
                <p>{platform.thesisClose}</p>
              </aside>
            </MobileSubStory>
          </div>
        </MobileLearnMore>
      }
    />
  )
}
