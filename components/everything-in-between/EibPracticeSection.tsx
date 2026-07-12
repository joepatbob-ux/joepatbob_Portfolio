import { FlowChapterSlideLayout } from '@/components/chapter-slide/FlowChapterSlideLayout'
import { StickerPile } from '@/components/StickerPile'
import { ChapterCopyReveal } from '@/components/chapter-slide/ChapterCopyReveal'
import { EibPracticeClose } from '@/components/everything-in-between/EibSectionParts'
import { MobileProse } from '@/components/mobile/MobileSectionParts'
import { parseChapterBody } from '@/lib/chapter-slide/parseChapterBody'
import {
  EIB_PRACTICE,
  eibChapterId,
} from '@/lib/everything-in-between/content'
import { useContentDebug } from '@/components/ContentDebugProvider'

export function EibPracticeSection() {
  const { text } = useContentDebug()
  const chapterId = eibChapterId('practice')
  const headline = text(
    'everything-in-between/practice/chapter#headline',
    EIB_PRACTICE.headline,
  )
  const body = text(
    'everything-in-between/practice/chapter#body',
    EIB_PRACTICE.intro,
  )
  const close = text(
    'everything-in-between/practice/chapter#close',
    EIB_PRACTICE.close,
  )

  return (
    <FlowChapterSlideLayout
      chapterId={chapterId}
      fillViewport
      isLast
      className="mobile-chapter-slot eib-section-slot eib-section-slot--practice"
      stageAriaLabel="Launch sticker pile — drag stickers onto the page"
      stage={<StickerPile />}
      copy={
        <ChapterCopyReveal headline={headline}>
          <MobileProse
            className="eib-sub-intro"
            paragraphs={parseChapterBody(body)}
          />
          <EibPracticeClose statement={close} />
        </ChapterCopyReveal>
      }
    />
  )
}
