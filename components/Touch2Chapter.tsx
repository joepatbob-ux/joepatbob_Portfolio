'use client'

import { ChapterSlideLayout } from '@/components/chapter-slide/ChapterSlideLayout'
import { Touch2Carousel } from '@/components/touch2/Touch2Carousel'
import type { Chapter } from '@/lib/types'

interface Props {
  chapter: Chapter
  isLast: boolean
}

export function Touch2Chapter({ chapter, isLast }: Props) {
  return (
    <ChapterSlideLayout
      chapter={chapter}
      chapterId="hardware-touch-2"
      modifier="touch-2"
      isLast={isLast}
      stageAriaLabel={chapter.imageAlt}
      stage={<Touch2Carousel />}
    />
  )
}
