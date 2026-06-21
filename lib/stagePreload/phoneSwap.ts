import { PHONE_SWAP_URLS } from '@/lib/phone-swap/phoneSwapUrls'
import { preloadFetches } from '@/lib/stagePreload/preloadAssets'
import { preloadOnce } from '@/lib/stagePreload/preloadOnce'

const PHONE_SWAP_PRELOAD_URLS = [
  PHONE_SWAP_URLS.pixel8.glb,
  PHONE_SWAP_URLS.iphone16.glb,
] as const

/** Warm geometry assets only — PhoneSwap chunk loads when the stage mounts. */
export function preloadPhoneSwapStage(): Promise<void> {
  return preloadOnce('stage:phone-swap', async () => {
    await preloadFetches(PHONE_SWAP_PRELOAD_URLS)
  })
}
