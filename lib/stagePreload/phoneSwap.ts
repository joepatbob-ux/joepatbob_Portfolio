import { PHONE_SWAP_URLS } from '@/lib/phone-swap/phoneSwapUrls'
import { preloadFetches } from '@/lib/stagePreload/preloadAssets'
import { preloadOnce } from '@/lib/stagePreload/preloadOnce'

/** OBJ/MTL only — defer textures until the canvas mounts; never preload the JS chunk. */
const PHONE_SWAP_PRELOAD_URLS = [
  PHONE_SWAP_URLS.pixel8.obj,
  PHONE_SWAP_URLS.pixel8.mtl,
  PHONE_SWAP_URLS.iphone16.obj,
  PHONE_SWAP_URLS.iphone16.mtl,
] as const

/** Warm geometry assets only — PhoneSwap chunk loads when the stage mounts. */
export function preloadPhoneSwapStage(): Promise<void> {
  return preloadOnce('stage:phone-swap', async () => {
    await preloadFetches(PHONE_SWAP_PRELOAD_URLS)
  })
}
