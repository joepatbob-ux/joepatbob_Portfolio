'use client'

import { HardwareChapterLayout } from '@/components/hardware/HardwareChapterLayout'
import { LavaLampCarousel } from '@/components/LavaLampCarousel'
import type { Chapter } from '@/lib/types'

interface Props {
  chapter: Chapter
  isLast: boolean
}

export function Touch2Chapter({ chapter, isLast }: Props) {
  return (
    <HardwareChapterLayout
      chapter={chapter}
      chapterId="hardware-touch-2"
      variant="touch-2"
      isLast={isLast}
      copyFirst
      stage={<LavaLampCarousel />}
    />
  )
}
