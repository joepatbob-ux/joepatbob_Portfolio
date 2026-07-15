import { useEffect, useState } from 'react'
import dynamic from '@/lib/dynamic'
import { useHydrated } from '@/lib/hooks/useHydrated'

/* Dev-only tooling, flag-gated at the mount so its chunks are never fetched on
 * a normal visit. The flag checks are inlined (rather than imported from the
 * panels' own modules) so none of that code enters the entry graph; they must
 * stay in sync with isContentDebugEnabled / isNavSentenceEditorEnabled /
 * isSensiLiteSegmentDebugEnabled, which the panels re-check internally. */

function devFlag(param: string): boolean {
  if (typeof window === 'undefined') return false
  if (process.env.NODE_ENV === 'production') return false
  return new URLSearchParams(window.location.search).get(param) === '1'
}

/* Unlike devFlag, no NODE_ENV gate — tuning panels have to work on preview
 * deploys (prod builds). Still lazy, so a normal visit never loads them. */
function previewFlag(param: string): boolean {
  if (typeof window === 'undefined') return false
  return new URLSearchParams(window.location.search).get(param) === '1'
}

const ContentDebugPanel = dynamic(
  () =>
    import('@/components/ContentDebugPanel').then((m) => ({
      default: m.ContentDebugPanel,
    })),
  { loading: () => null },
)

const NavSentenceEditorPanel = dynamic(
  () =>
    import('@/components/NavSentenceEditorPanel').then((m) => ({
      default: m.NavSentenceEditorPanel,
    })),
  { loading: () => null },
)

const SensiLiteSegmentAtlas = dynamic(
  () =>
    import('@/components/sensi-lite/SensiLiteSegmentAtlas').then((m) => ({
      default: m.SensiLiteSegmentAtlas,
    })),
  { loading: () => null },
)

const FadeTunePanel = dynamic(
  () =>
    import('@/components/FadeTunePanel').then((m) => ({
      default: m.FadeTunePanel,
    })),
  { loading: () => null },
)

export function DevPanels() {
  const hydrated = useHydrated()
  const [flags, setFlags] = useState({
    content: false,
    sentence: false,
    atlas: false,
    fadeTune: false,
  })

  useEffect(() => {
    if (!hydrated) return
    setFlags({
      content: devFlag('contentDebug'),
      sentence: devFlag('navSentence'),
      atlas: devFlag('sensiLiteSegments'),
      fadeTune: previewFlag('fadeTune'),
    })
  }, [hydrated])

  return (
    <>
      {flags.content ? <ContentDebugPanel /> : null}
      {flags.sentence ? <NavSentenceEditorPanel /> : null}
      {flags.atlas ? <SensiLiteSegmentAtlas /> : null}
      {flags.fadeTune ? <FadeTunePanel /> : null}
    </>
  )
}
