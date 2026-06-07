'use client'

import type { ChapterLayoutMode } from '@/lib/chapter-slide/layoutMode'
import { useLayoutCompactBand } from '@/lib/hooks/useLayoutCompactBand'
import { useLayoutMobile } from '@/lib/hooks/useLayoutMobile'

/** Single source for chapter slide responsive mode (mobile ≤767 | compact 768–1023 | desktop ≥1024). */
export function useChapterLayoutMode(): ChapterLayoutMode {
  const isMobile = useLayoutMobile()
  const isCompactBand = useLayoutCompactBand()

  if (isMobile) return 'mobile'
  if (isCompactBand) return 'compact'
  return 'desktop'
}
