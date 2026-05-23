'use client'

import { ChapterViewport } from '@/components/ChapterViewport'
import { EimChapter } from '@/components/EimChapter'
import { SensiLiteChapter } from '@/components/SensiLiteChapter'
import { StudyChapter } from '@/components/StudyChapter'
import { Touch2Chapter } from '@/components/Touch2Chapter'
import { VerdantChapter } from '@/components/VerdantChapter'
import type { ChapterInsertDef } from '@/lib/chapterInserts'
import { fullInsertChapterId } from '@/lib/chapterInserts'
import type { Chapter } from '@/lib/types'
import type { ReactNode } from 'react'

export interface ChapterRenderContext {
  chapter: Chapter
  sectionId: string
  isLast: boolean
}

function fullChapterId(sectionId: string, chapter: Chapter): string {
  return `${sectionId}-${chapter.id}`
}

/** Maps section chapter ids to slide layouts and custom stages. */
export function ChapterRenderer({
  chapter,
  sectionId,
  isLast,
}: ChapterRenderContext): ReactNode {
  const chapterId = fullChapterId(sectionId, chapter)

  switch (chapterId) {
    case 'hardware-sensi-lite':
      return <SensiLiteChapter chapter={chapter} isLast={isLast} />
    case 'hardware-touch-2':
      return <Touch2Chapter chapter={chapter} isLast={isLast} />
    case 'hardware-eim':
      return <EimChapter chapter={chapter} isLast={isLast} />
    case 'hardware-verdant':
      return <VerdantChapter chapter={chapter} isLast={isLast} />
    default:
      return (
        <StudyChapter chapter={chapter} sectionId={sectionId} isLast={isLast} />
      )
  }
}

function ChapterInsertContent({ insertId: _insertId }: { insertId: string }) {
  return null
}

/** Viewport + content for slides declared in `CHAPTER_INSERTS`. */
export function ChapterInsertSlide({
  sectionId,
  insert,
}: {
  sectionId: string
  insert: ChapterInsertDef
}) {
  return (
    <ChapterViewport
      chapterId={fullInsertChapterId(sectionId, insert.insertId)}
      fillViewport={insert.fillViewport}
      className={insert.viewportClassName}
    >
      <ChapterInsertContent insertId={insert.insertId} />
    </ChapterViewport>
  )
}
