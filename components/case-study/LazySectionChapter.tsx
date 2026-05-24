'use client'

import dynamic from 'next/dynamic'

const MobileChapter = dynamic(
  () =>
    import('@/components/mobile/MobileChapter').then((m) => ({
      default: m.MobileChapter,
    })),
  { loading: () => null },
)

const WebAppsKelvinChapter = dynamic(
  () =>
    import('@/components/web-apps/WebAppsKelvinChapter').then((m) => ({
      default: m.WebAppsKelvinChapter,
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
      return <WebAppsKelvinChapter />
    case 'everything-else':
      return <EverythingInBetweenChapter />
    default:
      return null
  }
}
