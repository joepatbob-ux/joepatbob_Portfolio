'use client'

import { FlowChapterSlideLayout } from '@/components/chapter-slide/FlowChapterSlideLayout'
import { StickerPile } from '@/components/StickerPile'
import { ChapterCopyReveal } from '@/components/chapter-slide/ChapterCopyReveal'
import { EibPracticeClose } from '@/components/everything-in-between/EibSectionParts'
import { MobileProse, splitParagraphs } from '@/components/mobile/MobileSectionParts'
import {
  EIB_PRACTICE,
  eibChapterId,
} from '@/lib/everything-in-between/content'

export function EibPracticeSection() {
  const chapterId = eibChapterId('practice')

  return (
    <FlowChapterSlideLayout
      chapterId={chapterId}
      fillViewport
      isLast
      className="mobile-chapter-slot eib-section-slot eib-section-slot--practice"
      stageAriaLabel="Launch sticker pile — drag stickers onto the page"
      stage={<StickerPile />}
      copy={
        <ChapterCopyReveal headline={EIB_PRACTICE.headline}>
          <MobileProse
            className="eib-sub-intro"
            paragraphs={splitParagraphs(EIB_PRACTICE.intro)}
          />
          <EibPracticeClose statement={EIB_PRACTICE.close} />
        </ChapterCopyReveal>
      }
    />
  )
}
