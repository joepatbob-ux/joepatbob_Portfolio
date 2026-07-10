import { useChapterNav } from '@/components/ChapterNavProvider'
import { useChapterActive } from '@/lib/chapterActiveContext'
import {
  CHAPTER_INTERACTIVE_VISIBILITY,
  CHAPTER_STAGE_PAINT_VISIBILITY,
  chapterIsInteractive,
} from '@/lib/chapterVisibility'
import { isContinuousChapters } from '@/lib/continuousChapters'
import { useChapterReveal, usePublishedActiveSlideId } from '@/lib/hooks/useChapterReveal'
import { useChapterStageReveal } from '@/lib/hooks/useChapterStageReveal'

const latchedStageMount = new Set<string>()

/**
 * Stage mount vs. run state for heavy WebGL / canvas chapters.
 * - `mount`: latched once copy is interactively visible — never unmounts on re-scroll.
 * - `active`: chapter is the scroll target — run sims, enable frameloop, etc.
 */
export function useChapterStageMount(chapterId: string) {
  const active = useChapterActive()
  const reveal = useChapterReveal(chapterId)
  const stageReveal = useChapterStageReveal(chapterId)
  const continuous = isContinuousChapters()
  const nav = useChapterNav()
  const publishedActiveSlideId = usePublishedActiveSlideId()
  const activeSlideId =
    nav?.phase === 'idle' ? publishedActiveSlideId : (nav?.activeSlideId ?? null)
  const interactive = chapterIsInteractive(
    reveal,
    activeSlideId,
    chapterId,
  )

  const mountReady = continuous
    ? stageReveal >= CHAPTER_STAGE_PAINT_VISIBILITY
    : reveal >= CHAPTER_INTERACTIVE_VISIBILITY

  if (active || interactive || mountReady) {
    latchedStageMount.add(chapterId)
  }

  const mount = latchedStageMount.has(chapterId)

  return { mount, active, reveal, stageReveal }
}
