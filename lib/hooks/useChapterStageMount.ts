'use client'

import { useChapterNav } from '@/components/ChapterNavProvider'
import { useChapterActive } from '@/lib/chapterActiveContext'
import { useChapterReveal, usePublishedActiveSlideId } from '@/lib/hooks/useChapterReveal'
import { chapterIsInteractive } from '@/lib/chapterVisibility'

/** Mount canvas before full interactivity so assets can load off-screen. */
const STAGE_PREMOUNT_REVEAL = 0.02

const latchedStageMount = new Set<string>()

/**
 * Stage mount vs. run state for heavy WebGL / canvas chapters.
 * - `mount`: latched once near viewport — never unmounts on re-scroll.
 * - `active`: chapter is the scroll target — run sims, enable frameloop, etc.
 */
export function useChapterStageMount(chapterId: string) {
  const active = useChapterActive()
  const reveal = useChapterReveal(chapterId)
  const nav = useChapterNav()
  const publishedActiveSlideId = usePublishedActiveSlideId()
  const activeSlideId =
    nav?.phase === 'idle' ? publishedActiveSlideId : (nav?.activeSlideId ?? null)
  const interactive = chapterIsInteractive(
    reveal,
    activeSlideId,
    chapterId,
  )
  const premount = reveal >= STAGE_PREMOUNT_REVEAL

  if (active || interactive || premount) {
    latchedStageMount.add(chapterId)
  }

  const mount = latchedStageMount.has(chapterId)

  return { mount, active, reveal }
}
