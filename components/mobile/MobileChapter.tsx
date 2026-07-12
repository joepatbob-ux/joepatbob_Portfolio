import { CaseStudyFlowOverview } from '@/components/case-study/CaseStudyFlowOverview'
import { MobileStagePreloads } from '@/components/mobile/MobileStagePreloads'
import { MobileSensiSection } from '@/components/mobile/MobileSensiSection'
import { MobileWrConnectSection } from '@/components/mobile/MobileWrConnectSection'
import { useContentDebug } from '@/components/ContentDebugProvider'
import { mobile } from '@/lib/sections/mobile'

export function MobileChapter() {
  const { patchSection } = useContentDebug()
  const section = patchSection(mobile)

  return (
    <div className="mobile-chapter">
      <MobileStagePreloads />
      <CaseStudyFlowOverview
        chapterId="mobile-overview"
        headline={section.headline}
        body={section.overviewBody}
        blocks={section.overviewBlocks}
        className="mobile-chapter-slot--overview"
      />
      <MobileSensiSection />
      <MobileWrConnectSection />
    </div>
  )
}
