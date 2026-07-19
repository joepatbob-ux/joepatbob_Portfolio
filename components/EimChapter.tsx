import { useChapterNav } from '@/components/ChapterNavProvider'
import { EimPathArt } from '@/components/EimPathArt'
import { ChapterSlideLayout } from '@/components/chapter-slide/ChapterSlideLayout'
import { useChapterPanelOpacity } from '@/lib/hooks/useChapterPanelOpacity'
import { useChapterStageFx } from '@/lib/hooks/useChapterStageFx'
import type { Chapter } from '@/lib/types'

const CHAPTER_ID = 'hardware-eim'
/* The cascade must land with the chapter's ~200ms crossfade — a slow draw
 * leaves the artifact half-dark through a normal scroll pass. */
const DRAW_MS = 300

interface Props {
  chapter: Chapter
  isLast: boolean
}

export function EimChapter({ chapter, isLast }: Props) {
  const { phase, targetId } = useChapterNav()
  const { isActive } = useChapterPanelOpacity(CHAPTER_ID)
  const stageFxVisible = useChapterStageFx(CHAPTER_ID)

  const isEnteringOnOffCycle =
    (phase === 'out' || phase === 'in') && targetId === CHAPTER_ID

  // Dash cycle rides the stage's actual dissolve (same beat as stickers), not
  // the reveal threshold — otherwise the draw runs before the artifact is
  // visible and the art arrives pre-lit. Falls back to isActive where no
  // stage machine runs (mobile, deck).
  const pathActive = (stageFxVisible ?? isActive) || isEnteringOnOffCycle

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
