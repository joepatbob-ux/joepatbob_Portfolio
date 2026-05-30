'use client'

import { ChapterSlideLayout } from '@/components/chapter-slide/ChapterSlideLayout'
import { SensiLiteProto } from '@/components/SensiLiteProto'
import type { Chapter } from '@/lib/types'

interface Props {
  chapter: Chapter
  isLast: boolean
}

export function SensiLiteChapter({ chapter, isLast }: Props) {
  return (
    <ChapterSlideLayout
      chapter={chapter}
      chapterId="hardware-sensi-lite"
      modifier="sensi-lite"
      isLast={isLast}
      interactiveCursor
      stageId="hardware-sensi-lite-interactive"
      stageAriaLabel="Sensi Lite interactive prototype"
      stage={<SensiLiteProto showControlsLegend={false} useDotCursor />}
    />
  )
}
