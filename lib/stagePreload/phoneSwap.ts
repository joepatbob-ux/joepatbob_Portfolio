import { PHONE_SWAP_URLS } from '@/lib/phone-swap/phoneSwapUrls'
import { preloadFetches } from '@/lib/stagePreload/preloadAssets'
import { preloadOnce } from '@/lib/stagePreload/preloadOnce'

const PHONE_SWAP_ASSET_URLS = [
  PHONE_SWAP_URLS.pixel8.obj,
  PHONE_SWAP_URLS.pixel8.mtl,
  PHONE_SWAP_URLS.iphone16.obj,
  PHONE_SWAP_URLS.iphone16.mtl,
  PHONE_SWAP_URLS.pixel8.screen,
  PHONE_SWAP_URLS.iphone16.screen,
  PHONE_SWAP_URLS.pixel8.bodyJadeLight,
  PHONE_SWAP_URLS.pixel8.logoAlpha,
  PHONE_SWAP_URLS.iphone16.brushNormalRough,
  PHONE_SWAP_URLS.iphone16.brushNormalSatin,
] as const

/** JS chunk + OBJ/MTL/textures — safe to call before the canvas mounts. */
export function preloadPhoneSwapStage(): Promise<void> {
  return preloadOnce('stage:phone-swap', async () => {
    void import('@/components/PhoneSwap')
    await preloadFetches(PHONE_SWAP_ASSET_URLS)
  })
}
