'use client'

import { CaseStudyFlowOverview } from '@/components/case-study/CaseStudyFlowOverview'
import { MobileStagePreloads } from '@/components/mobile/MobileStagePreloads'
import { MobileSensiSection } from '@/components/mobile/MobileSensiSection'
import { MobileWrConnectSection } from '@/components/mobile/MobileWrConnectSection'
import { mobile } from '@/lib/sections/mobile'

export function MobileChapter() {
  return (
    <div className="mobile-chapter">
      <MobileStagePreloads />
      <CaseStudyFlowOverview
        chapterId="mobile-overview"
        headline={mobile.headline}
        body={mobile.overviewBody}
        meta={mobile.overviewMeta}
        className="mobile-chapter-slot--overview"
      />
      <MobileSensiSection />
      <MobileWrConnectSection />
    </div>
  )
}
