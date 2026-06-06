'use client'

import dynamic from 'next/dynamic'
import { CaseStudyFlowOverview } from '@/components/case-study/CaseStudyFlowOverview'
import { webApps } from '@/lib/sections/webapps'

const WebAppsKelvinChapter = dynamic(
  () =>
    import('@/components/web-apps/WebAppsKelvinChapter').then((m) => ({
      default: m.WebAppsKelvinChapter,
    })),
  { loading: () => null },
)

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
