'use client'

import type { ChapterLayoutMode } from '@/lib/chapter-slide/layoutMode'
import { useLayoutCompactBand } from '@/lib/hooks/useLayoutCompactBand'
import { useLayoutMobile } from '@/lib/hooks/useLayoutMobile'

/** Single source for chapter slide responsive mode (mobile | compact | desktop). */
export function useChapterLayoutMode(): ChapterLayoutMode {
  const isMobile = useLayoutMobile()
  const isCompactBand = useLayoutCompactBand()

  if (isMobile) return 'mobile'
  if (isCompactBand) return 'compact'
  return 'desktop'
}
