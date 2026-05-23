'use client'

import { ChapterCopyScroller } from '@/components/ChapterCopyScroller'
import { ChapterViewport } from '@/components/ChapterViewport'
import { CaseStudySplit } from '@/components/case-study/CaseStudySplit'
import { StickerPile } from '@/components/StickerPile'
import {
  EibPrinciplesList,
  EibSubSectionIntro,
  splitParagraphs,
} from '@/components/everything-in-between/EibSectionParts'
import {
  EIB_CONVICTION,
  eibChapterId,
} from '@/lib/everything-in-between/content'
import { useCopyScrollActive } from '@/lib/useCopyScrollActive'

export function EibConvictionSection() {
  const chapterId = eibChapterId('conviction')
  const copyScrollActive = useCopyScrollActive(chapterId)

  return (
    <ChapterViewport
      chapterId={chapterId}
      fillViewport
      className="mobile-chapter-slot eib-section-slot eib-section-slot--conviction"
    >
      <ChapterCopyScroller
        active={copyScrollActive}
        className="mobile-chapter-panel__scroll"
      >
        <div className="mobile-chapter-panel__content eib-section__content">
          <EibSubSectionIntro>
            {splitParagraphs(EIB_CONVICTION.intro).map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </EibSubSectionIntro>
          <CaseStudySplit
            copy={<EibPrinciplesList items={EIB_CONVICTION.principles} />}
            stage={<StickerPile />}
          />
        </div>
      </ChapterCopyScroller>
    </ChapterViewport>
  )
}
