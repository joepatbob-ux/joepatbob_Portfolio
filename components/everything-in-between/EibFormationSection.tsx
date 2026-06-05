'use client'

import { FlowChapterSlideLayout } from '@/components/chapter-slide/FlowChapterSlideLayout'
import { ChapterCopyReveal } from '@/components/chapter-slide/ChapterCopyReveal'
import { FormationLegoBoard } from '@/components/formation/FormationLegoBoard'
import {
  EibPatentRow,
  EibSubSectionIntro,
  splitParagraphs,
} from '@/components/everything-in-between/EibSectionParts'
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
      stage={<FormationLegoBoard />}
      copy={
        <ChapterCopyReveal headline={EIB_FORMATION.headline}>
          <EibSubSectionIntro>
            {splitParagraphs(EIB_FORMATION.intro).map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </EibSubSectionIntro>
          <EibPatentRow patents={patents} />
        </ChapterCopyReveal>
      }
    />
  )
}
