'use client'

import { CaseStudyFlowOverview } from '@/components/case-study/CaseStudyFlowOverview'
import { EibConceptsSection } from '@/components/everything-in-between/EibConceptsSection'
import { EibFormationSection } from '@/components/everything-in-between/EibFormationSection'
import { EibPracticeSection } from '@/components/everything-in-between/EibPracticeSection'
import { EibStagePreloads } from '@/components/everything-in-between/EibStagePreloads'
import { EIB_CHAPTER_INTRO } from '@/lib/everything-in-between/content'
import { everythingElse } from '@/lib/sections/everything-else'

const EIB_OVERVIEW_ID = 'everything-else-overview'

export function EverythingInBetweenChapter() {
  return (
    <div className="eib-chapter mobile-chapter">
      <EibStagePreloads />
      <CaseStudyFlowOverview
        chapterId={EIB_OVERVIEW_ID}
        headline={everythingElse.headline}
        body={EIB_CHAPTER_INTRO}
        className="mobile-chapter-slot--overview"
      />
      <EibConceptsSection />
      <EibFormationSection />
      <EibPracticeSection />
    </div>
  )
}
