'use client'

import { FlowChapterSlideLayout } from '@/components/chapter-slide/FlowChapterSlideLayout'
import { StickerPile } from '@/components/StickerPile'
import { CaseStudySectionHeader } from '@/components/case-study/CaseStudySectionHeader'
import {
  EibPrinciplesList,
  EibSubSectionIntro,
  splitParagraphs,
} from '@/components/everything-in-between/EibSectionParts'
import {
  EIB_CONVICTION,
  eibChapterId,
} from '@/lib/everything-in-between/content'

export function EibConvictionSection() {
  const chapterId = eibChapterId('conviction')

  return (
    <FlowChapterSlideLayout
      chapterId={chapterId}
      fillViewport
      className="mobile-chapter-slot eib-section-slot eib-section-slot--conviction"
      stage={<StickerPile />}
      copy={
        <>
          <CaseStudySectionHeader headline={EIB_CONVICTION.headline} />
          <EibSubSectionIntro>
            {splitParagraphs(EIB_CONVICTION.intro).map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </EibSubSectionIntro>
          <EibPrinciplesList items={EIB_CONVICTION.principles} />
        </>
      }
    />
  )
}
