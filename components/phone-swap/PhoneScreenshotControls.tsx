'use client'

import { Touch2CarouselDots } from '@/components/touch2/Touch2CarouselDots'
import {
  PHONE_SCREENSHOT_SLIDES,
  type PhoneScreenTheme,
} from '@/lib/phone-swap/phoneScreenshotSlides'
import type { Touch2CarouselPauseHandlers } from '@/lib/touch2/useTouch2CarouselPlayback'
import { useTouch2HorizontalDotMetrics } from '@/lib/touch2/useTouch2HorizontalDotMetrics'
import { useRef } from 'react'

interface Props {
  slideIndex: number
  slideCount: number
  slideKeys: readonly string[]
  screenTheme: PhoneScreenTheme
  indicatorProgress: number
  pauseHandlers: Touch2CarouselPauseHandlers
  onSelectSlide: (index: number) => void
  onScreenThemeChange: (theme: PhoneScreenTheme) => void
}

export function PhoneScreenshotControls({
  slideIndex,
  slideCount,
  slideKeys,
  screenTheme,
  indicatorProgress,
  pauseHandlers,
  onSelectSlide,
  onScreenThemeChange,
}: Props) {
  const rowRef = useRef<HTMLDivElement>(null)
  const themeRef = useRef<HTMLDivElement>(null)
  const dotMetrics = useTouch2HorizontalDotMetrics(
    slideCount,
    rowRef,
    themeRef,
  )
  const showDots = slideCount > 1
  const activeSlide = PHONE_SCREENSHOT_SLIDES[slideIndex]
  const activeLabel = activeSlide?.label ?? 'Screenshot'
  const activeDescription = activeSlide?.description

  return (
    <div
      className="phone-swap__screenshot-controls"
      role="region"
      aria-roledescription="carousel"
      aria-label="App screenshots"
      aria-live="polite"
      {...pauseHandlers}
    >
      <p className="phone-swap__screenshot-sr">
        {activeDescription
          ? `${activeLabel} — ${activeDescription}, ${screenTheme} mode, ${slideIndex + 1} of ${slideCount}`
          : `${activeLabel}, ${screenTheme} mode, ${slideIndex + 1} of ${slideCount}`}
      </p>

      <div
        ref={rowRef}
        className="phone-swap__screenshot-controls-row touch2-carousel__dot-vars"
        style={dotMetrics}
      >
        {showDots ? (
          <Touch2CarouselDots
            count={slideCount}
            activeIndex={slideIndex}
            slideKeys={slideKeys}
            activeProgress={indicatorProgress}
            onSelect={onSelectSlide}
            className="phone-swap__screenshot-dots touch2-carousel__dots touch2-carousel__dots--horizontal"
            ariaLabel="Choose app screenshot"
            itemAriaLabel={(i, count) => `Screenshot ${i + 1} of ${count}`}
          />
        ) : null}

        <div
          ref={themeRef}
          className="contact-liquid contact-liquid--segmented phone-swap__screen-theme"
          role="group"
          aria-label="Screenshot appearance"
        >
          <div className="contact-liquid__surface">
            <div className="contact-liquid__split">
              <button
                type="button"
                className={[
                  'contact-liquid__btn',
                  screenTheme === 'light' ? 'contact-liquid__btn--active' : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
                aria-pressed={screenTheme === 'light'}
                onClick={() => onScreenThemeChange('light')}
              >
                Light
              </button>
              <button
                type="button"
                className={[
                  'contact-liquid__btn',
                  screenTheme === 'dark' ? 'contact-liquid__btn--active' : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
                aria-pressed={screenTheme === 'dark'}
                onClick={() => onScreenThemeChange('dark')}
              >
                Dark
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
