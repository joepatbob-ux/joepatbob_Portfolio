'use client'

import { EverythingInBetweenChapter } from '@/components/everything-in-between/EverythingInBetweenChapter'
import { MobileChapter } from '@/components/mobile/MobileChapter'
import { WebAppsChapter } from '@/components/web-apps/WebAppsChapter'

export function LazySectionChapter({ sectionId }: { sectionId: string }) {
  switch (sectionId) {
    case 'mobile':
      return <MobileChapter />
    case 'web-apps':
      return <WebAppsChapter />
    case 'everything-else':
      return <EverythingInBetweenChapter />
    default:
      return null
  }
}
