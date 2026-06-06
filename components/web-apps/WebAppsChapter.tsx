'use client'

import { CaseStudyFlowOverview } from '@/components/case-study/CaseStudyFlowOverview'
import { WebAppsKelvinChapter } from '@/components/web-apps/WebAppsKelvinChapter'
import { webApps } from '@/lib/sections/webapps'

export function WebAppsChapter() {
  return (
    <div className="web-apps-chapter mobile-chapter">
      <CaseStudyFlowOverview
        chapterId="web-apps-overview"
        headline={webApps.headline}
        body={webApps.overviewBody}
        meta={webApps.overviewMeta}
        className="web-apps-chapter-slot--overview"
      />
      <WebAppsKelvinChapter />
    </div>
  )
}
