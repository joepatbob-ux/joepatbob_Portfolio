'use client'

import { useChapterNav } from '@/components/ChapterNavProvider'
import { EimPathArt } from '@/components/EimPathArt'
import { HardwareChapterLayout } from '@/components/hardware/HardwareChapterLayout'
import { useChapterPanelOpacity } from '@/lib/useChapterPanelOpacity'
import type { Chapter } from '@/lib/types'

const CHAPTER_ID = 'hardware-eim'
const DRAW_MS = 3000

interface Props {
  chapter: Chapter
  isLast: boolean
}

export function EimChapter({ chapter, isLast }: Props) {
  const { phase, targetId } = useChapterNav()
  const { isActive } = useChapterPanelOpacity(CHAPTER_ID)

  const isEnteringOnOffCycle =
    (phase === 'out' || phase === 'in') && targetId === CHAPTER_ID

  const pathActive = isActive || isEnteringOnOffCycle

  return (
    <HardwareChapterLayout
      chapter={chapter}
      chapterId={CHAPTER_ID}
      variant="eim"
      isLast={isLast}
      stage={
        <EimPathArt
          active={pathActive}
          triggerDraw={pathActive}
          drawDurationMs={DRAW_MS}
        />
      }
    />
  )
}
