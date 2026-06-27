'use client'

import { CaseStudyFlowOverview } from '@/components/case-study/CaseStudyFlowOverview'
import { EibConceptsSection } from '@/components/everything-in-between/EibConceptsSection'
import { EibFormationSection } from '@/components/everything-in-between/EibFormationSection'
import { EibPracticeSection } from '@/components/everything-in-between/EibPracticeSection'
import { EibStagePreloads } from '@/components/everything-in-between/EibStagePreloads'
import { everythingElse } from '@/lib/sections/everything-else'

const EIB_OVERVIEW_ID = 'everything-else-overview'

export function EverythingInBetweenChapter() {
  return (
    <div className="mobile-chapter">
      <EibStagePreloads />
      <CaseStudyFlowOverview
        chapterId={EIB_OVERVIEW_ID}
        headline={everythingElse.headline}
        body={everythingElse.overviewBody}
        blocks={everythingElse.overviewBlocks}
        className="mobile-chapter-slot--overview"
      />
      <EibConceptsSection />
      <EibFormationSection />
      <EibPracticeSection />
    </div>
  )
}
