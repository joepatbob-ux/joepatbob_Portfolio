'use client'

import { MobileChapter } from '@/components/mobile/MobileChapter'
import { WebAppsChapter } from '@/components/web-apps/WebAppsChapter'
import { EverythingInBetweenChapter } from '@/components/everything-in-between/EverythingInBetweenChapter'

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
