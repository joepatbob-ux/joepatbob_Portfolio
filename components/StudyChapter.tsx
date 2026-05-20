'use client'

import { ChapterSlideLayout } from '@/components/chapter-slide/ChapterSlideLayout'
import { ChapterStageMedia } from '@/components/chapter-slide/ChapterStageMedia'
import type { Chapter } from '@/lib/types'
import type { ReactNode } from 'react'

interface Props {
  chapter: Chapter
  sectionId: string
  isLast: boolean
  /** Override default image/placeholder stage (e.g. StickerPile, BeforeAfterSlider). */
  stage?: ReactNode
}

export function StudyChapter({ chapter, sectionId, isLast, stage }: Props) {
  const chapterId = `${sectionId}-${chapter.id}`
  const copyFirst =
    chapter.imagePosition === 'right' && chapter.imageLayout !== 'full-width'

  return (
    <ChapterSlideLayout
      chapter={chapter}
      chapterId={chapterId}
      isLast={isLast}
      modifier={chapter.id}
      copyFirst={copyFirst}
      stage={stage ?? <ChapterStageMedia chapter={chapter} />}
    />
  )
}
