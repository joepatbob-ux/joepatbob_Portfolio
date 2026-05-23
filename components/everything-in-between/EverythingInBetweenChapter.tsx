'use client'

import { ChapterCopyScroller } from '@/components/ChapterCopyScroller'
import { ChapterViewport } from '@/components/ChapterViewport'
import { EibConvictionSection } from '@/components/everything-in-between/EibConvictionSection'
import { EibFormationSection } from '@/components/everything-in-between/EibFormationSection'
import { EibPracticeSection } from '@/components/everything-in-between/EibPracticeSection'
import { EibIntroProse } from '@/components/everything-in-between/EibSectionParts'
import { EIB_CHAPTER_INTRO } from '@/lib/everything-in-between/content'
import { useCopyScrollActive } from '@/lib/useCopyScrollActive'

const EIB_OVERVIEW_ID = 'everything-else-overview'

export function EverythingInBetweenChapter() {
  const copyScrollActive = useCopyScrollActive(EIB_OVERVIEW_ID)

  return (
    <div className="eib-chapter mobile-chapter">
      <ChapterViewport
        chapterId={EIB_OVERVIEW_ID}
        fillViewport
        className="mobile-chapter-slot eib-chapter-intro-slot"
      >
        <ChapterCopyScroller
          active={copyScrollActive}
          className="mobile-chapter-panel__scroll"
        >
          <div className="mobile-chapter-panel__content eib-chapter-intro">
            <p className="eib-chapter-intro__eyebrow">Everything In Between</p>
            <EibIntroProse text={EIB_CHAPTER_INTRO} />
          </div>
        </ChapterCopyScroller>
      </ChapterViewport>

      <EibConvictionSection />
      <EibFormationSection />
      <EibPracticeSection />
    </div>
  )
}
