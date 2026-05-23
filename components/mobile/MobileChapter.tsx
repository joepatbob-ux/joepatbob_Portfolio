'use client'

import { MobileSensiSection } from '@/components/mobile/MobileSensiSection'
import { MobileSpotlightSection } from '@/components/mobile/MobileSpotlightSection'
import { MobileWrConnectSection } from '@/components/mobile/MobileWrConnectSection'

export function MobileChapter() {
  return (
    <div className="mobile-chapter">
      <MobileSensiSection />
      <MobileSpotlightSection />
      <MobileWrConnectSection />
    </div>
  )
}
