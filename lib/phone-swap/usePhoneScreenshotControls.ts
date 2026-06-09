'use client'

import { useTheme } from '@/components/ThemeProvider'
import {
  PHONE_SCREENSHOT_SLIDES,
  phoneScreenshotUrls,
  type PhoneScreenTheme,
} from '@/lib/phone-swap/phoneScreenshotSlides'
import { useCallback, useEffect, useMemo, useState } from 'react'

export function usePhoneScreenshotControls() {
  const { resolvedTheme } = useTheme()
  const [slideIndex, setSlideIndex] = useState(0)
  const [screenTheme, setScreenTheme] = useState<PhoneScreenTheme>(resolvedTheme)

  useEffect(() => {
    setScreenTheme(resolvedTheme)
  }, [resolvedTheme])

  const slideCount = PHONE_SCREENSHOT_SLIDES.length
  const slideKeys = useMemo(
    () => PHONE_SCREENSHOT_SLIDES.map((slide) => slide.id),
    [],
  )

  const urls = useMemo(
    () => phoneScreenshotUrls(slideIndex, screenTheme),
    [slideIndex, screenTheme],
  )

  const selectSlide = useCallback((index: number) => {
    setSlideIndex(index)
  }, [])

  const toggleScreenTheme = useCallback(() => {
    setScreenTheme((theme) => (theme === 'light' ? 'dark' : 'light'))
  }, [])

  const setScreenThemeExplicit = useCallback((theme: PhoneScreenTheme) => {
    setScreenTheme(theme)
  }, [])

  return {
    slideIndex,
    slideCount,
    slideKeys,
    screenTheme,
    androidScreenUrl: urls.android,
    iphoneScreenUrl: urls.iphone,
    selectSlide,
    toggleScreenTheme,
    setScreenTheme: setScreenThemeExplicit,
  }
}
