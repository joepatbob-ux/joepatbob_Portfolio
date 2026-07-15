import dynamic from '@/lib/dynamic'

/* Real lazy boundaries — static imports here would pull every section (and its
 * 3D stack) into the entry chunk. Placeholder height keeps scroll geometry
 * stable while a chunk loads. */

function SectionLoading() {
  return <div style={{ minHeight: '100vh' }} aria-hidden="true" />
}

const MobileChapter = dynamic(
  () =>
    import('@/components/mobile/MobileChapter').then((m) => ({
      default: m.MobileChapter,
    })),
  { loading: SectionLoading, preloadForHydration: true },
)

const WebAppsChapter = dynamic(
  () =>
    import('@/components/web-apps/WebAppsChapter').then((m) => ({
      default: m.WebAppsChapter,
    })),
  { loading: SectionLoading, preloadForHydration: true },
)

const EverythingInBetweenChapter = dynamic(
  () =>
    import('@/components/everything-in-between/EverythingInBetweenChapter').then(
      (m) => ({ default: m.EverythingInBetweenChapter }),
    ),
  { loading: SectionLoading, preloadForHydration: true },
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
