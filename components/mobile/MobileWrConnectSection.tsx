'use client'

import { FlowChapterSlideLayout } from '@/components/chapter-slide/FlowChapterSlideLayout'
import { ChapterCopyReveal } from '@/components/chapter-slide/ChapterCopyReveal'
import { WrConnectBoardStage } from '@/components/mobile/WrConnectBoardStage'
import { MobileProse } from '@/components/mobile/MobileSectionParts'
import { parseChapterBody } from '@/lib/chapter-slide/parseChapterBody'
import { MOBILE_WR_CONNECT, mobileChapterId } from '@/lib/mobile/content'

export function MobileWrConnectSection() {
  const chapterId = mobileChapterId('wr-connect')
  const paragraphs = parseChapterBody(MOBILE_WR_CONNECT.body)

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
        <ChapterCopyReveal headline={MOBILE_WR_CONNECT.headline}>
          <MobileProse paragraphs={paragraphs} />
        </ChapterCopyReveal>
      }
    />
  )
}
