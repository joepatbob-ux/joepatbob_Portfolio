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

  // The draw *starts* once the entrance settles: stage-fx "visible" means the
  // artifact has arrived on its center lock — its blur/fade has ended — which
  // is later than the reveal threshold, so the art never arrives pre-lit.
  // Falls back to isActive where no stage machine runs (mobile, deck).
  const drawSettled = (stageFxVisible ?? isActive) || isEnteringOnOffCycle
  // Presence is reveal-based, so the slot-end exit dissolve — which now flips
  // stage-fx off well before the chapter leaves (#100's scroll-yank fix) —
  // can't undraw the art while it's still on screen. It holds, then exits
  // passively with the chapter's own fade. Splitting these two is what keeps
  // the draw from being cut short the moment the exit lead fires.
  const present = isActive || isEnteringOnOffCycle

  return (
    <ChapterSlideLayout
      chapter={chapter}
      chapterId={CHAPTER_ID}
      modifier="eim"
      isLast={isLast}
      stageAriaLabel={chapter.imageAlt}
      stage={
        <EimPathArt
          active={present}
          triggerDraw={drawSettled}
          drawDurationMs={DRAW_MS}
        />
      }
    />
  )
}
