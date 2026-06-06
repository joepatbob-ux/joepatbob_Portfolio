'use client'

import { CaseStudyFlowOverview } from '@/components/case-study/CaseStudyFlowOverview'
import { EibConvictionSection } from '@/components/everything-in-between/EibConvictionSection'
import { EibFormationSection } from '@/components/everything-in-between/EibFormationSection'
import { EibPracticeSection } from '@/components/everything-in-between/EibPracticeSection'
import { EIB_CHAPTER_INTRO } from '@/lib/everything-in-between/content'
import { everythingElse } from '@/lib/sections/everything-else'

const EIB_OVERVIEW_ID = 'everything-else-overview'

export function EverythingInBetweenChapter() {
  return (
    <div className="eib-chapter mobile-chapter">
      <CaseStudyFlowOverview
        chapterId={EIB_OVERVIEW_ID}
        headline={everythingElse.headline}
        body={EIB_CHAPTER_INTRO}
        className="mobile-chapter-slot--overview"
      />
      <EibConvictionSection />
      <EibFormationSection />
      <EibPracticeSection />
    </div>
  )
}
