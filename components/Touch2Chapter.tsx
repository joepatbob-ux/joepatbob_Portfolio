'use client'

import { ChapterSlideLayout } from '@/components/chapter-slide/ChapterSlideLayout'
import { LavaLampCarousel } from '@/components/LavaLampCarousel'
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
      copyFirst
      stage={<LavaLampCarousel />}
    />
  )
}
