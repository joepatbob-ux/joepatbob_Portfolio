'use client'

import { useStagePreload } from '@/lib/hooks/useStagePreload'
import { CHAPTER_INTERACTIVE_VISIBILITY } from '@/lib/chapterVisibility'
import { mobileChapterId } from '@/lib/mobile/content'
import { preloadPhoneSwapStage } from '@/lib/stagePreload/phoneSwap'

/** Warm PhoneSwap geometry once the Sensi stage is near the viewport. */
export function MobileStagePreloads() {
  useStagePreload(
    mobileChapterId('sensi'),
    preloadPhoneSwapStage,
    CHAPTER_INTERACTIVE_VISIBILITY,
  )
  return null
}
