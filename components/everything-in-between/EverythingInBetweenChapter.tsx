import { CaseStudyFlowOverview } from '@/components/case-study/CaseStudyFlowOverview'
import { EibFormationSection } from '@/components/everything-in-between/EibFormationSection'
import { EibPracticeSection } from '@/components/everything-in-between/EibPracticeSection'
import { EibStagePreloads } from '@/components/everything-in-between/EibStagePreloads'
import { useContentDebug } from '@/components/ContentDebugProvider'
import { everythingElse } from '@/lib/sections/everything-else'

const EIB_OVERVIEW_ID = 'everything-else-overview'

export function EverythingInBetweenChapter() {
  const { patchSection } = useContentDebug()
  const section = patchSection(everythingElse)

  return (
    <div className="mobile-chapter">
      <EibStagePreloads />
      <CaseStudyFlowOverview
        chapterId={EIB_OVERVIEW_ID}
        headline={section.headline}
        body={section.overviewBody}
        blocks={section.overviewBlocks}
        className="mobile-chapter-slot--overview"
      />
      <EibFormationSection />
      <EibPracticeSection />
    </div>
  )
}
