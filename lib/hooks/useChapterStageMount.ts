'use client'

import { useChapterNav } from '@/components/ChapterNavProvider'
import { useChapterActive } from '@/lib/chapterActiveContext'
import { useChapterReveal } from '@/lib/hooks/useChapterReveal'
import { chapterIsInteractive } from '@/lib/chapterVisibility'

/**
 * Stage mount vs. run state for heavy WebGL / canvas chapters.
 * - `mount`: mount canvas early (interactive threshold) so assets can load off-screen.
 * - `active`: chapter is the scroll target — run sims, enable frameloop, etc.
 */
export function useChapterStageMount(chapterId: string) {
  const active = useChapterActive()
  const reveal = useChapterReveal(chapterId)
  const nav = useChapterNav()
  const mount =
    active ||
    chapterIsInteractive(reveal, nav?.activeSlideId ?? null, chapterId)

  return { mount, active, reveal }
}
