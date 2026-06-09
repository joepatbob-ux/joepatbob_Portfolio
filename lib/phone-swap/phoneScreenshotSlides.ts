import { publicAssetUrl } from '@/lib/phone-swap/publicAssetUrl'

export type PhoneScreenTheme = 'light' | 'dark'

export type PhoneScreenshotSet = Record<PhoneScreenTheme, string>

export type PhoneScreenshotSlide = {
  id: string
  label: string
  android: PhoneScreenshotSet
  iphone: PhoneScreenshotSet
}

/**
 * Phone UI screenshots shown on the 3D device displays.
 * Add slides here — each needs light + dark paths per device.
 * Paths are relative to `/public` (encoded via {@link publicAssetUrl}).
 */
export const PHONE_SCREENSHOT_SLIDES: readonly PhoneScreenshotSlide[] = [
  {
    id: 'overview',
    label: 'Overview',
    android: {
      light: '/models/Android.png',
      dark: '/models/Android.png',
    },
    iphone: {
      light: '/models/Iphone.png',
      dark: '/models/Iphone.png',
    },
  },
]

export function phoneScreenshotUrls(
  slideIndex: number,
  theme: PhoneScreenTheme,
): { android: string; iphone: string } {
  const slide =
    PHONE_SCREENSHOT_SLIDES[slideIndex] ?? PHONE_SCREENSHOT_SLIDES[0]
  return {
    android: publicAssetUrl(slide.android[theme]),
    iphone: publicAssetUrl(slide.iphone[theme]),
  }
}
