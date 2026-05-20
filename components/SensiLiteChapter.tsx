'use client'

import { HardwareChapterLayout } from '@/components/hardware/HardwareChapterLayout'
import { SensiLiteProto } from '@/components/SensiLiteProto'
import type { Chapter } from '@/lib/types'

interface Props {
  chapter: Chapter
  isLast: boolean
}

export function SensiLiteChapter({ chapter, isLast }: Props) {
  return (
    <HardwareChapterLayout
      chapter={chapter}
      chapterId="hardware-sensi-lite"
      variant="sensi-lite"
      isLast={isLast}
      stageId="hardware-sensi-lite-interactive"
      stageAriaLabel="Sensi Lite interactive prototype"
      stage={<SensiLiteProto showControlsLegend={false} />}
    />
  )
}
