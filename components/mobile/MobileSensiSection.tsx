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
import { useHydrated } from '@/lib/hooks/useHydrated'
import { useChapterStageReady } from '@/lib/chapterStageMountContext'
import { MOBILE_SENSI, mobileChapterId } from '@/lib/mobile/content'
import { StageLoadingFallback } from '@/components/stage/StageSpinner'

const PhoneSwap = dynamic(
  () => import('@/components/PhoneSwap').then((m) => ({ default: m.PhoneSwap })),
  {
    loading: () => <StageLoadingFallback label="Loading 3D preview…" />,
  },
)

/** Renders inside ChapterViewport — gates the heavy 3D chunk until the slide is near. */
function MobileSensiStage() {
  const hydrated = useHydrated()
  const stageReady = useChapterStageReady()

  if (!hydrated || !stageReady) {
    return <div className="phone-swap__stage-reserve" aria-hidden="true" />
  }

  return (
    <PhoneSwapBoundary key="phone-swap-3d">
      <PhoneSwap />
    </PhoneSwapBoundary>
  )
}

export function MobileSensiSection() {
  const chapterId = mobileChapterId('sensi')
  const [color, install, spotlight] = MOBILE_SENSI.subStories
  const intro = splitParagraphs(MOBILE_SENSI.intro)

  return (
    <FlowChapterSlideLayout
      chapterId={chapterId}
      fillViewport
      className="mobile-chapter-slot mobile-chapter-slot--sensi"
      stageAriaLabel="Sensi app on iPhone and Android 3D preview"
      stage={<MobileSensiStage />}
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
