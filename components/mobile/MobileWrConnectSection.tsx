'use client'

import { FlowChapterSlideLayout } from '@/components/chapter-slide/FlowChapterSlideLayout'
import { ChapterCopyReveal } from '@/components/chapter-slide/ChapterCopyReveal'
import { MobileProse, splitParagraphs } from '@/components/mobile/MobileSectionParts'
import { MOBILE_WR_CONNECT, mobileChapterId } from '@/lib/mobile/content'

export function MobileWrConnectSection() {
  const chapterId = mobileChapterId('wr-connect')
  const paragraphs = splitParagraphs(MOBILE_WR_CONNECT.body)

  return (
    <FlowChapterSlideLayout
      chapterId={chapterId}
      fillViewport
      isLast
      className="mobile-chapter-slot mobile-chapter-slot--wr-connect"
      stageAriaLabel={MOBILE_WR_CONNECT.imageAlt}
      stage={<div className="flow-chapter-slide__stage--empty" aria-hidden />}
      copy={
        <ChapterCopyReveal headline={MOBILE_WR_CONNECT.headline}>
          <MobileProse paragraphs={paragraphs} />
        </ChapterCopyReveal>
      }
    />
  )
}
