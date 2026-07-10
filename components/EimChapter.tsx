import { useChapterNav } from '@/components/ChapterNavProvider'
import { EimPathArt } from '@/components/EimPathArt'
import { ChapterSlideLayout } from '@/components/chapter-slide/ChapterSlideLayout'
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
    <ChapterSlideLayout
      chapter={chapter}
      chapterId={CHAPTER_ID}
      modifier="eim"
      isLast={isLast}
      stageAriaLabel={chapter.imageAlt}
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
