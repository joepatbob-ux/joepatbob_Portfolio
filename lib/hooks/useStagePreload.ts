'use client'

import { useChapterReveal } from '@/lib/hooks/useChapterReveal'
import { CHAPTER_A11Y_VISIBILITY } from '@/lib/chapterVisibility'
import { useEffect, useRef } from 'react'

/**
 * Fire a stage preload once the chapter starts entering the viewport.
 * Uses a low threshold so assets warm while the user is still scrolling toward it.
 */
export function useStagePreload(
  chapterId: string,
  preload: () => void | Promise<void>,
  threshold = CHAPTER_A11Y_VISIBILITY,
): void {
  const reveal = useChapterReveal(chapterId)
  const firedRef = useRef(false)

  useEffect(() => {
    if (firedRef.current || reveal < threshold) return
    firedRef.current = true
    void preload()
  }, [chapterId, preload, reveal, threshold])
}
