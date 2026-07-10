import { FlowChapterSlideLayout } from '@/components/chapter-slide/FlowChapterSlideLayout'
import { ChapterCopyReveal } from '@/components/chapter-slide/ChapterCopyReveal'
import { FormationLegoBoard } from '@/components/formation/FormationLegoBoard'
import { EibPatentRow } from '@/components/everything-in-between/EibSectionParts'
import { MobileProse } from '@/components/mobile/MobileSectionParts'
import { parseChapterBody } from '@/lib/chapter-slide/parseChapterBody'
import {
  EIB_FORMATION,
  eibChapterId,
} from '@/lib/everything-in-between/content'

export function EibFormationSection() {
  const chapterId = eibChapterId('formation')

  const patents = EIB_FORMATION.patents.map((p) => ({
    number: p.number,
    title: p.title,
    status: p.status,
  }))

  return (
    <FlowChapterSlideLayout
      chapterId={chapterId}
      fillViewport
      className="mobile-chapter-slot eib-section-slot eib-section-slot--formation flow-chapter-slide--formation"
      stageAriaLabel="Formation LEGO board — patent claim visualization"
      stage={<FormationLegoBoard chapterId={chapterId} />}
      copy={
        <ChapterCopyReveal headline={EIB_FORMATION.headline}>
          <MobileProse
            className="eib-sub-intro"
            paragraphs={parseChapterBody(EIB_FORMATION.intro)}
          />
          <EibPatentRow patents={patents} />
        </ChapterCopyReveal>
      }
    />
  )
}
