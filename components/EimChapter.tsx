import { useChapterNav } from '@/components/ChapterNavProvider'
import { EimPathArt } from '@/components/EimPathArt'
import { ChapterSlideLayout } from '@/components/chapter-slide/ChapterSlideLayout'
import { useChapterPanelOpacity } from '@/lib/hooks/useChapterPanelOpacity'
import { useChapterStageFx } from '@/lib/hooks/useChapterStageFx'
import { useLayoutTopBarNav } from '@/lib/hooks/useLayoutTopBarNav'
import { isContinuousChapters } from '@/lib/scroll/continuousChapters'
import type { Chapter } from '@/lib/types'

const CHAPTER_ID = 'hardware-eim'

interface Props {
  chapter: Chapter
  isLast: boolean
}

export function EimChapter({ chapter, isLast }: Props) {
  const { phase, targetId } = useChapterNav()
  const { isActive } = useChapterPanelOpacity(CHAPTER_ID)
  const stageFxVisible = useChapterStageFx(CHAPTER_ID)
  const topBarNav = useLayoutTopBarNav()

  const isEnteringOnOffCycle =
    (phase === 'out' || phase === 'in') && targetId === CHAPTER_ID

  // Only the continuous-desktop machine emits a settle signal (stage-fx
  // "visible" = artifact locked on center, blur/fade ended). On mobile / top-bar
  // nav no machine runs, so the bus stays `undefined` and there's nothing to
  // wait for — the draw is gated on the reveal threshold instead. (Guarding on
  // the layout is what keeps a stale `false` from the machine's teardown from
  // being read as "not settled" and stranding the art dark — see the bus's
  // clearChapterStageFx.)
  const continuousDesktop = !topBarNav && isContinuousChapters()

  // The draw *starts* once the entrance settles on desktop, so the art never
  // arrives pre-lit; on mobile it starts at the reveal threshold.
  const drawSettled = continuousDesktop
    ? stageFxVisible === true || isEnteringOnOffCycle
    : isActive || isEnteringOnOffCycle
  // Presence is reveal-based, so the slot-end exit dissolve — which flips
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
      stage={<EimPathArt active={present} triggerDraw={drawSettled} />}
    />
  )
}
