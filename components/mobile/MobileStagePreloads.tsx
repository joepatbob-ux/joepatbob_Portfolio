'use client'

import { useStagePreload } from '@/lib/hooks/useStagePreload'
import { mobileChapterId } from '@/lib/mobile/content'
import { preloadPhoneSwapStage } from '@/lib/stagePreload/phoneSwap'

/** Background warm-up for mobile stage assets as chapters enter the scroll viewport. */
export function MobileStagePreloads() {
  useStagePreload(mobileChapterId('sensi'), preloadPhoneSwapStage)
  return null
}
