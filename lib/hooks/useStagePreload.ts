'use client'

import { useChapterReveal } from '@/lib/hooks/useChapterReveal'
import { useEffect, useRef } from 'react'

/**
 * Fire a stage preload once the chapter starts entering the viewport.
 * Uses a low threshold so assets warm while the user is still scrolling toward it.
 */
export function useStagePreload(
  chapterId: string,
  preload: () => void | Promise<void>,
  threshold = 0.01,
): void {
  const reveal = useChapterReveal(chapterId)
  const firedRef = useRef(false)

  useEffect(() => {
    if (firedRef.current || reveal < threshold) return
    firedRef.current = true
    void preload()
  }, [chapterId, preload, reveal, threshold])
}
