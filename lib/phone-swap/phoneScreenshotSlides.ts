import { publicAssetUrl } from '@/lib/phone-swap/publicAssetUrl'

export type PhoneScreenTheme = 'light' | 'dark'

export type PhoneScreenshotSet = Record<PhoneScreenTheme, string>

export type PhoneScreenshotSlide = {
  id: string
  label: string
  description: string
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
    description: 'Home screen with current temperature and schedule',
    android: {
      light: '/images/screens/android/Dashboard_light-optimized.webp',
      dark: '/images/screens/android/Dashboard_dark-optimized.webp',
    },
    iphone: {
      light: '/images/screens/ios/Dashboard_light-optimized.webp',
      dark: '/images/screens/ios/Dashboard_dark-optimized.webp',
    },
  },
  {
    id: 'usage',
    label: 'Usage',
    description: 'Energy usage history and runtime charts',
    android: {
      light: '/images/screens/android/Usage_light-optimized.webp',
      dark: '/images/screens/android/Usage_dark-optimized.webp',
    },
    iphone: {
      light: '/images/screens/ios/Usage_light-optimized.webp',
      dark: '/images/screens/ios/Usage_dark-optimized.webp',
    },
  },
  {
    id: 'ec',
    label: 'Equipment',
    description: 'Connected HVAC equipment configuration',
    android: {
      light: '/images/screens/android/EC_light-optimized.webp',
      dark: '/images/screens/android/EC_dark-optimized.webp',
    },
    iphone: {
      light: '/images/screens/ios/EC_light-optimized.webp',
      dark: '/images/screens/ios/EC_dark-optimized.webp',
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
