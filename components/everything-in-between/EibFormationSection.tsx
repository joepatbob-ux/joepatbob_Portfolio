'use client'

import { ChapterCopyScroller } from '@/components/ChapterCopyScroller'
import { ChapterViewport } from '@/components/ChapterViewport'
import { CaseStudySplit } from '@/components/case-study/CaseStudySplit'
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
import { useCopyScrollActive } from '@/lib/useCopyScrollActive'

export function EibFormationSection() {
  const chapterId = eibChapterId('formation')
  const copyScrollActive = useCopyScrollActive(chapterId)

  const patents = EIB_FORMATION.patents.map((p) => ({
    number: p.number,
    title: p.title,
    status: p.status,
  }))

  return (
    <ChapterViewport
      chapterId={chapterId}
      fillViewport
      className="mobile-chapter-slot eib-section-slot eib-section-slot--formation"
    >
      <ChapterCopyScroller
        active={copyScrollActive}
        className="mobile-chapter-panel__scroll"
      >
        <div className="mobile-chapter-panel__content eib-section__content">
          <CaseStudySplit
            className="case-study-split--formation-lego"
            copy={
              <>
                <EibSubSectionIntro>
                  {splitParagraphs(EIB_FORMATION.intro).map((p, i) => (
                    <p key={i}>{p}</p>
                  ))}
                </EibSubSectionIntro>
                <EibPatentRow patents={patents} />
              </>
            }
            stage={<FormationLegoBoard />}
          />
        </div>
      </ChapterCopyScroller>
    </ChapterViewport>
  )
}
