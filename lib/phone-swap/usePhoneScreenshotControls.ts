'use client'

import { useTheme } from '@/components/ThemeProvider'
import { useChapterActive } from '@/lib/chapterActiveContext'
import {
  PHONE_SCREENSHOT_SLIDES,
  phoneScreenshotUrls,
  type PhoneScreenTheme,
} from '@/lib/phone-swap/phoneScreenshotSlides'
import { useTouch2CarouselPlayback } from '@/lib/touch2/useTouch2CarouselPlayback'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

export function usePhoneScreenshotControls() {
  const { resolvedTheme } = useTheme()
  const isActive = useChapterActive()
  const [screenTheme, setScreenThemeState] =
    useState<PhoneScreenTheme>(resolvedTheme)

  const slideCount = PHONE_SCREENSHOT_SLIDES.length
  const slideKeys = useMemo(
    () => PHONE_SCREENSHOT_SLIDES.map((slide) => slide.id),
    [],
  )

  const {
    index: slideIndex,
    selectIndex: selectSlide,
    indicatorProgress,
    pauseHandlers,
  } = useTouch2CarouselPlayback(slideCount, { isActive })

  useEffect(() => {
    setScreenThemeState(resolvedTheme)
  }, [resolvedTheme])

  const slideIndexRef = useRef(slideIndex)
  slideIndexRef.current = slideIndex

  useEffect(() => {
    selectSlide(slideIndexRef.current)
  }, [screenTheme, selectSlide])

  const urls = useMemo(
    () => phoneScreenshotUrls(slideIndex, screenTheme),
    [slideIndex, screenTheme],
  )

  useEffect(() => {
    if (!isActive || slideCount <= 1) return

    let cancelled = false
    const indices = [slideIndex, (slideIndex + 1) % slideCount]

    indices.forEach((i) => {
      const next = phoneScreenshotUrls(i, screenTheme)
      ;[next.android, next.iphone].forEach((src) => {
        const img = new Image()
        img.decoding = 'async'
        img.onload = () => {
          if (cancelled) return
        }
        img.src = src
      })
    })

    return () => {
      cancelled = true
    }
  }, [isActive, slideIndex, slideCount, screenTheme])

  const toggleScreenTheme = useCallback(() => {
    setScreenThemeState((theme) => (theme === 'light' ? 'dark' : 'light'))
  }, [])

  const setScreenThemeExplicit = useCallback((theme: PhoneScreenTheme) => {
    setScreenThemeState(theme)
  }, [])

  return {
    slideIndex,
    slideCount,
    slideKeys,
    screenTheme,
    indicatorProgress,
    pauseHandlers,
    androidScreenUrl: urls.android,
    iphoneScreenUrl: urls.iphone,
    selectSlide,
    toggleScreenTheme,
    setScreenTheme: setScreenThemeExplicit,
  }
}
