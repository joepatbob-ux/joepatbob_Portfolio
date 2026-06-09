'use client'

import { Touch2CarouselDots } from '@/components/touch2/Touch2CarouselDots'
import {
  PHONE_SCREENSHOT_SLIDES,
  type PhoneScreenTheme,
} from '@/lib/phone-swap/phoneScreenshotSlides'

interface Props {
  slideIndex: number
  slideCount: number
  slideKeys: readonly string[]
  screenTheme: PhoneScreenTheme
  onSelectSlide: (index: number) => void
  onScreenThemeChange: (theme: PhoneScreenTheme) => void
}

export function PhoneScreenshotControls({
  slideIndex,
  slideCount,
  slideKeys,
  screenTheme,
  onSelectSlide,
  onScreenThemeChange,
}: Props) {
  const showDots = slideCount > 1
  const activeLabel = PHONE_SCREENSHOT_SLIDES[slideIndex]?.label ?? 'Screenshot'

  return (
    <div className="phone-swap__screenshot-controls">
      <p className="phone-swap__screenshot-sr">
        {activeLabel}, {screenTheme} mode, {slideIndex + 1} of {slideCount}
      </p>

      <div className="phone-swap__screenshot-controls-row">
        {showDots ? (
          <Touch2CarouselDots
            count={slideCount}
            activeIndex={slideIndex}
            slideKeys={slideKeys}
            onSelect={onSelectSlide}
            className="phone-swap__screenshot-dots"
            ariaLabel="Choose app screenshot"
            itemAriaLabel={(i, count) => `Screenshot ${i + 1} of ${count}`}
          />
        ) : null}

        <div
          className="phone-swap__screen-theme"
          role="group"
          aria-label="Screenshot appearance"
        >
          <button
            type="button"
            className={[
              'phone-swap__screen-theme-btn',
              screenTheme === 'light' ? 'phone-swap__screen-theme-btn--active' : '',
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
              'phone-swap__screen-theme-btn',
              screenTheme === 'dark' ? 'phone-swap__screen-theme-btn--active' : '',
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
  )
}
