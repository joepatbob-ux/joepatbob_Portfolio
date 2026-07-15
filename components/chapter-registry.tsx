import { ChapterViewport } from '@/components/ChapterViewport'
import { StudyChapter } from '@/components/StudyChapter'
import dynamic from '@/lib/dynamic'
import type { ChapterInsertDef } from '@/lib/chapterInserts'
import { fullInsertChapterId } from '@/lib/chapterInserts'
import type { Chapter } from '@/lib/types'
import type { ComponentType, ReactNode } from 'react'

/* Real lazy boundaries — static imports here would ship every hardware stage
 * (Sensi Lite LCD prototype + segment tooling, Touch 2, EIM, Verdant) in the
 * entry chunk. Placeholder height keeps scroll geometry stable while a chunk
 * loads (same pattern as LazySectionChapter). */

function ChapterLoading() {
  return <div style={{ minHeight: '100vh' }} aria-hidden="true" />
}

const SensiLiteChapter = dynamic(
  () =>
    import('@/components/SensiLiteChapter').then((m) => ({
      default: m.SensiLiteChapter,
    })),
  { loading: ChapterLoading, preloadForHydration: true },
)

const Touch2Chapter = dynamic(
  () =>
    import('@/components/Touch2Chapter').then((m) => ({
      default: m.Touch2Chapter,
    })),
  { loading: ChapterLoading, preloadForHydration: true },
)

const EimChapter = dynamic(
  () =>
    import('@/components/EimChapter').then((m) => ({ default: m.EimChapter })),
  { loading: ChapterLoading, preloadForHydration: true },
)

const VerdantChapter = dynamic(
  () =>
    import('@/components/VerdantChapter').then((m) => ({
      default: m.VerdantChapter,
    })),
  { loading: ChapterLoading, preloadForHydration: true },
)

export interface ChapterRenderContext {
  chapter: Chapter
  sectionId: string
  isLast: boolean
}

function fullChapterId(sectionId: string, chapter: Chapter): string {
  return `${sectionId}-${chapter.id}`
}

/** Chapters with custom stage wrappers, keyed by full chapter id. */
const CUSTOM_CHAPTERS: Record<
  string,
  ComponentType<{ chapter: Chapter; isLast: boolean }>
> = {
  'hardware-sensi-lite': SensiLiteChapter,
  'hardware-touch-2': Touch2Chapter,
  'hardware-eim': EimChapter,
  'hardware-verdant': VerdantChapter,
}

/** Maps section chapter ids to slide layouts and custom stages. */
export function ChapterRenderer({
  chapter,
  sectionId,
  isLast,
}: ChapterRenderContext): ReactNode {
  const Custom = CUSTOM_CHAPTERS[fullChapterId(sectionId, chapter)]
  if (Custom) return <Custom chapter={chapter} isLast={isLast} />
  return <StudyChapter chapter={chapter} sectionId={sectionId} isLast={isLast} />
}

/** Viewport + content for slides declared in `CHAPTER_INSERTS`. */
export function ChapterInsertSlide({
  sectionId,
  insert,
}: {
  sectionId: string
  insert: ChapterInsertDef
}) {
  const content = insert.render?.({ sectionId }) ?? null
  if (!content) {
    if (import.meta.env.DEV) {
      console.warn(
        `[ChapterInsert] Missing render() for ${fullInsertChapterId(sectionId, insert.insertId)}`,
      )
    }
    return null
  }

  return (
    <ChapterViewport
      chapterId={fullInsertChapterId(sectionId, insert.insertId)}
      fillViewport={insert.fillViewport}
      className={insert.viewportClassName}
    >
      {content}
    </ChapterViewport>
  )
}
