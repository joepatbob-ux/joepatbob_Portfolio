import { phoneScreenshotUrls } from '@/lib/phone-swap/phoneScreenshotSlides'
import { PHONE_SWAP_URLS } from '@/lib/phone-swap/phoneSwapUrls'
import { preloadFetches, preloadImages } from '@/lib/stagePreload/preloadAssets'
import { preloadOnce } from '@/lib/stagePreload/preloadOnce'

const PHONE_SWAP_GLB_URLS = [
  PHONE_SWAP_URLS.pixel8.glb,
  PHONE_SWAP_URLS.iphone16.glb,
] as const

/** Warm geometry + initial screenshots — PhoneSwap chunk loads when the stage mounts. */
export function preloadPhoneSwapStage(): Promise<void> {
  return preloadOnce('stage:phone-swap', async () => {
    const dark = phoneScreenshotUrls(0, 'dark')
    const light = phoneScreenshotUrls(0, 'light')
    await Promise.all([
      preloadFetches(PHONE_SWAP_GLB_URLS),
      preloadImages([dark.android, dark.iphone, light.android, light.iphone]),
    ])
  })
}
