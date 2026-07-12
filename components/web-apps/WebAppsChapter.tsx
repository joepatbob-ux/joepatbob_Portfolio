import { CaseStudyFlowOverview } from '@/components/case-study/CaseStudyFlowOverview'
import { WebAppsKelvinChapter } from '@/components/web-apps/WebAppsKelvinChapter'
import { useContentDebug } from '@/components/ContentDebugProvider'
import { webApps } from '@/lib/sections/webapps'

export function WebAppsChapter() {
  const { patchSection } = useContentDebug()
  const section = patchSection(webApps)

  return (
    <div className="web-apps-chapter mobile-chapter">
      <CaseStudyFlowOverview
        chapterId="web-apps-overview"
        headline={section.headline}
        body={section.overviewBody}
        blocks={section.overviewBlocks}
        className="web-apps-chapter-slot--overview"
      />
      <WebAppsKelvinChapter />
    </div>
  )
}
