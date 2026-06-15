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
    id: 'dashboard',
    label: 'Dashboard',
    android: {
      light: '/models/Android.png',
      dark: '/models/Android.png',
    },
    iphone: {
      light: '/Screens/iOS/Dashboard_light.png',
      dark: '/Screens/iOS/Dashboard_dark.png',
    },
  },
  {
    id: 'usage',
    label: 'Usage',
    android: {
      light: '/models/Android.png',
      dark: '/models/Android.png',
    },
    iphone: {
      light: '/Screens/iOS/Usage_light.png',
      dark: '/Screens/iOS/Usage_dark.png',
    },
  },
  {
    id: 'ec',
    label: 'Equipment',
    android: {
      light: '/models/Android.png',
      dark: '/models/Android.png',
    },
    iphone: {
      light: '/Screens/iOS/EC_light.png',
      dark: '/Screens/iOS/EC_dark.png',
    },
  },
  {
    id: 'offline',
    label: 'Offline',
    android: {
      light: '/models/Android.png',
      dark: '/models/Android.png',
    },
    iphone: {
      light: '/Screens/iOS/Offline_light.png',
      dark: '/Screens/iOS/Offline_dark.png',
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
