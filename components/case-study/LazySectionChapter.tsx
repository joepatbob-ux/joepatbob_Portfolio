'use client'

import dynamic from 'next/dynamic'

const MobileChapter = dynamic(
  () =>
    import('@/components/mobile/MobileChapter').then((m) => ({
      default: m.MobileChapter,
    })),
  { loading: () => null },
)

const WebAppsChapter = dynamic(
  () =>
    import('@/components/web-apps/WebAppsChapter').then((m) => ({
      default: m.WebAppsChapter,
    })),
  { loading: () => null },
)

const EverythingInBetweenChapter = dynamic(
  () =>
    import('@/components/everything-in-between/EverythingInBetweenChapter').then(
      (m) => ({ default: m.EverythingInBetweenChapter }),
    ),
  { loading: () => null },
)

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
