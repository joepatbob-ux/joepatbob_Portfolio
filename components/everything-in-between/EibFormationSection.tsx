import { FlowChapterSlideLayout } from '@/components/chapter-slide/FlowChapterSlideLayout'
import { ChapterCopyReveal } from '@/components/chapter-slide/ChapterCopyReveal'
import { FormationLegoBoard } from '@/components/formation/FormationLegoBoard'
import { MobileProse } from '@/components/mobile/MobileSectionParts'
import { parseChapterBody } from '@/lib/chapter-slide/parseChapterBody'
import {
  EIB_FORMATION,
  eibChapterId,
} from '@/lib/everything-in-between/content'
import { useContentDebug } from '@/components/ContentDebugProvider'

export function EibFormationSection() {
  const { text } = useContentDebug()
  const chapterId = eibChapterId('formation')
  const headline = text(
    'everything-in-between/formation/chapter#headline',
    EIB_FORMATION.headline,
  )
  const body = text(
    'everything-in-between/formation/chapter#body',
    EIB_FORMATION.intro,
  )

  return (
    <FlowChapterSlideLayout
      chapterId={chapterId}
      fillViewport
      className="mobile-chapter-slot eib-section-slot eib-section-slot--formation flow-chapter-slide--formation"
      stageAriaLabel="Formation LEGO board — patent claim visualization"
      stage={<FormationLegoBoard chapterId={chapterId} />}
      copy={
        <ChapterCopyReveal headline={headline}>
          <MobileProse
            className="eib-sub-intro"
            paragraphs={parseChapterBody(body)}
          />
        </ChapterCopyReveal>
      }
    />
  )
}
