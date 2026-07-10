import { useChapterReveal } from '@/lib/hooks/useChapterReveal'
import { CHAPTER_INTERACTIVE_VISIBILITY } from '@/lib/scroll/chapterVisibility'
import { useEffect, useRef } from 'react'

/**
 * Fire a stage preload once the chapter starts entering the viewport.
 */
export function useStagePreload(
  chapterId: string,
  preload: () => void | Promise<void>,
  threshold = CHAPTER_INTERACTIVE_VISIBILITY,
): void {
  const reveal = useChapterReveal(chapterId)
  const firedRef = useRef(false)

  useEffect(() => {
    if (firedRef.current || reveal < threshold) return
    firedRef.current = true
    void preload()
  }, [chapterId, preload, reveal, threshold])
}
