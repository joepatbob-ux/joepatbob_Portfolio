'use client'

import { ChapterSlideLayout } from '@/components/chapter-slide/ChapterSlideLayout'
import { ChapterStageMedia } from '@/components/chapter-slide/ChapterStageMedia'
import type { Chapter } from '@/lib/types'
import type { ReactNode } from 'react'

interface Props {
  chapter: Chapter
  sectionId: string
  isLast: boolean
  /** Override default image/placeholder stage (e.g. StickerPile, DragScrubber). */
  stage?: ReactNode
}

function slideModifier(chapter: Chapter): string {
  if (chapter.imageLayout === 'full-width') return 'full-width'
  return chapter.id
}

export function StudyChapter({ chapter, sectionId, isLast, stage }: Props) {
  const chapterId = `${sectionId}-${chapter.id}`
  const stacked = chapter.imageLayout === 'full-width'

  return (
    <ChapterSlideLayout
      chapter={chapter}
      chapterId={chapterId}
      isLast={isLast}
      modifier={slideModifier(chapter)}
      copyFirst={false}
      stage={stage ?? <ChapterStageMedia chapter={chapter} />}
    />
  )
}
