import { FlowChapterSlideLayout } from '@/components/chapter-slide/FlowChapterSlideLayout'
import { ChapterCopyReveal } from '@/components/chapter-slide/ChapterCopyReveal'
import { WrConnectBoardStage } from '@/components/mobile/WrConnectBoardStage'
import { MobileProse } from '@/components/mobile/MobileSectionParts'
import { parseChapterBody } from '@/lib/chapter-slide/parseChapterBody'
import { MOBILE_WR_CONNECT, mobileChapterId } from '@/lib/mobile/content'
import { useContentDebug } from '@/components/ContentDebugProvider'

export function MobileWrConnectSection() {
  const { text } = useContentDebug()
  const chapterId = mobileChapterId('wr-connect')
  const headline = text('mobile/wr-connect#headline', MOBILE_WR_CONNECT.headline)
  const body = text('mobile/wr-connect#body', MOBILE_WR_CONNECT.body)
  const paragraphs = parseChapterBody(body)

  return (
    <FlowChapterSlideLayout
      chapterId={chapterId}
      fillViewport
      isLast
      className="mobile-chapter-slot mobile-chapter-slot--wr-connect"
      stageAriaLabel={MOBILE_WR_CONNECT.imageAlt}
      stage={
        <WrConnectBoardStage
          src={MOBILE_WR_CONNECT.imageSrc}
          alt={MOBILE_WR_CONNECT.imageAlt}
        />
      }
      copy={
        <ChapterCopyReveal headline={headline}>
          <MobileProse paragraphs={paragraphs} />
        </ChapterCopyReveal>
      }
    />
  )
}
