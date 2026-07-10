import { useStagePreload } from '@/lib/hooks/useStagePreload'
import { CHAPTER_INTERACTIVE_VISIBILITY } from '@/lib/chapterVisibility'
import { MOBILE_WR_CONNECT, mobileChapterId } from '@/lib/mobile/content'
import { preloadPhoneSwapStage } from '@/lib/stagePreload/phoneSwap'
import { preloadWrConnectBoard } from '@/lib/stagePreload/wrConnectBoard'

/** Warm PhoneSwap geometry once the Sensi stage is near the viewport. */
export function MobileStagePreloads() {
  useStagePreload(
    mobileChapterId('sensi'),
    preloadPhoneSwapStage,
    CHAPTER_INTERACTIVE_VISIBILITY,
  )
  useStagePreload(
    mobileChapterId('wr-connect'),
    () => preloadWrConnectBoard(MOBILE_WR_CONNECT.imageSrc),
    CHAPTER_INTERACTIVE_VISIBILITY,
  )
  return null
}
