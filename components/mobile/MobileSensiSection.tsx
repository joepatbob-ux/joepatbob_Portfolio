import dynamic from '@/lib/dynamic'
import { FlowChapterSlideLayout } from '@/components/chapter-slide/FlowChapterSlideLayout'
import { PhoneSwapBoundary } from '@/components/phone-swap/PhoneSwapBoundary'
import { ChapterCopyReveal } from '@/components/chapter-slide/ChapterCopyReveal'
import { MobileProse } from '@/components/mobile/MobileSectionParts'
import { parseChapterBody } from '@/lib/chapter-slide/parseChapterBody'
import { useHydrated } from '@/lib/hooks/useHydrated'
import { useChapterStageReady } from '@/lib/chapterStageMountContext'
import { MOBILE_SENSI, mobileChapterId } from '@/lib/mobile/content'
import { useContentDebug } from '@/components/ContentDebugProvider'
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
  const { text } = useContentDebug()
  const chapterId = mobileChapterId('sensi')
  const headline = text('mobile/sensi/intro#headline', MOBILE_SENSI.headline)
  const body = text('mobile/sensi/intro#body', MOBILE_SENSI.intro)
  const intro = parseChapterBody(body)

  return (
    <FlowChapterSlideLayout
      chapterId={chapterId}
      fillViewport
      className="mobile-chapter-slot mobile-chapter-slot--sensi"
      stageAriaLabel="Sensi app on iPhone and Android 3D preview"
      stage={<MobileSensiStage />}
      copy={
        <ChapterCopyReveal headline={headline}>
          <MobileProse paragraphs={intro} />
        </ChapterCopyReveal>
      }
    />
  )
}
