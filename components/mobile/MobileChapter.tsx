'use client'

import { CaseStudyFlowOverview } from '@/components/case-study/CaseStudyFlowOverview'
import { MobileSensiSection } from '@/components/mobile/MobileSensiSection'
import { MobileSpotlightSection } from '@/components/mobile/MobileSpotlightSection'
import { MobileWrConnectSection } from '@/components/mobile/MobileWrConnectSection'
import { mobile } from '@/lib/sections/mobile'

export function MobileChapter() {
  return (
    <div className="mobile-chapter">
      <CaseStudyFlowOverview
        chapterId="mobile-overview"
        headline={mobile.headline}
        body={mobile.overviewBody}
        className="mobile-chapter-slot--overview"
      />
      <MobileSensiSection />
      <MobileSpotlightSection />
      <MobileWrConnectSection />
    </div>
  )
}
