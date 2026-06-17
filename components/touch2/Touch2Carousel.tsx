'use client'

import { Touch2CarouselDots } from '@/components/touch2/Touch2CarouselDots'
import { useChapterActive } from '@/lib/chapterActiveContext'
import { TOUCH2_CAROUSEL_IMAGES } from '@/lib/touch2CarouselImages'
import { LAYOUT_MQ } from '@/lib/layout/breakpoints'
import {
  touch2RailMetrics,
  touch2RailMetricsForWidth,
  touch2DotCssMetrics,
  type Touch2RailMetrics,
} from '@/lib/touch2/touch2StageMetrics'
import { useTouch2CarouselPlayback } from '@/lib/touch2/useTouch2CarouselPlayback'
import { memo, useEffect, useRef, useState } from 'react'

function railMetricsEqual(a: Touch2RailMetrics, b: Touch2RailMetrics): boolean {
  return a.railH === b.railH && a.slideW === b.slideW && a.scale === b.scale
}

export {
  TOUCH2_FRAME_HEIGHT,
  TOUCH2_FRAME_WIDTH,
} from '@/lib/touch2/touch2StageMetrics'

interface Slide {
  src: string
  alt: string
}

interface Props {
  slides?: readonly Slide[]
  className?: string
  /** Overrides default “Touch 2 photo gallery” label. */
  ariaLabel?: string
  autoPlay?: boolean
  autoPlayInterval?: number
}

function Touch2CarouselInner({
  slides = TOUCH2_CAROUSEL_IMAGES,
  className,
  ariaLabel = 'Touch 2 photo gallery',
  autoPlay = true,
  autoPlayInterval,
}: Props) {
  const isActive = useChapterActive()
  const count = slides.length
  const {
    index,
    selectIndex: selectSlide,
    reducedMotion,
    indicatorProgress,
    pauseHandlers,
  } = useTouch2CarouselPlayback(count, {
    autoPlay,
    autoPlayInterval,
    isActive,
  })

  useEffect(() => {
    if (!isActive) return

    let cancelled = false
    const indices = [index, (index + 1) % count]

    indices.forEach((i) => {
      const slide = slides[i]
      if (!slide) return

      const img = new Image()
      img.decoding = 'async'
      img.onload = () => {
        if (cancelled) return
      }
      img.src = slide.src
    })

    return () => {
      cancelled = true
    }
  }, [isActive, index, count, slides])

  const rootRef = useRef<HTMLDivElement>(null)
  const [railMetrics, setRailMetrics] = useState(() => touch2RailMetrics(count))
  const [isMobileLayout, setIsMobileLayout] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia(LAYOUT_MQ.mobile)
    const sync = () => setIsMobileLayout(mq.matches)
    sync()
    mq.addEventListener('change', sync)
    return () => mq.removeEventListener('change', sync)
  }, [])

  useEffect(() => {
    const root = rootRef.current
    if (!root || typeof ResizeObserver === 'undefined') {
      setRailMetrics((prev) => {
        const next = touch2RailMetrics(count)
        return railMetricsEqual(prev, next) ? prev : next
      })
      return
    }

    // Observe stage parent — stable width; avoids RO loop when rail metrics resize children.
    const observeTarget = root.parentElement ?? root
    let rafId = 0

    const update = () => {
      cancelAnimationFrame(rafId)
      rafId = requestAnimationFrame(() => {
        const gapSource = root
        const style = getComputedStyle(gapSource)
        const gap =
          parseFloat(style.columnGap) ||
          parseFloat(style.gap) ||
          parseFloat(style.getPropertyValue('--cs-touch2-gap')) ||
          parseFloat(style.getPropertyValue('--cs-touch2-mobile-gap')) ||
          32
        const next = touch2RailMetricsForWidth(
          count,
          observeTarget.clientWidth,
          gap,
        )
        setRailMetrics((prev) => (railMetricsEqual(prev, next) ? prev : next))
      })
    }

    update()
    const observer = new ResizeObserver(update)
    observer.observe(observeTarget)
    return () => {
      cancelAnimationFrame(rafId)
      observer.disconnect()
    }
  }, [count, isMobileLayout])

  const { railH, slideW, scale } = railMetrics

  const railSizeStyle = isMobileLayout
    ? {}
    : {
        '--touch2-rail-h': `${railH}px`,
        '--touch2-slide-w': `${slideW}px`,
      }

  return (
    <div
      ref={rootRef}
      className={['touch2-carousel', className].filter(Boolean).join(' ')}
      style={
        {
          ...railSizeStyle,
          ...touch2DotCssMetrics(scale),
        } as React.CSSProperties
      }
      role="region"
      aria-roledescription="carousel"
      aria-label={ariaLabel}
      aria-live="polite"
      {...pauseHandlers}
    >
      <p className="touch2-carousel__sr-status">
        Photo {index + 1} of {count}
      </p>

      <div
        className={[
          'touch2-carousel__slides',
          'touch2-carousel__slides--ready',
          reducedMotion ? 'touch2-carousel__slides--instant' : '',
        ]
          .filter(Boolean)
          .join(' ')}
      >
        {slides.map((slide, i) => (
          <figure
            key={slide.src}
            className={[
              'touch2-carousel__slide',
              i === index ? 'touch2-carousel__slide--active' : '',
            ]
              .filter(Boolean)
              .join(' ')}
            aria-hidden={i !== index}
          >
            <img
              src={slide.src}
              alt={i === index ? slide.alt : ''}
              className="touch2-carousel__img"
              decoding="async"
              draggable={false}
            />
          </figure>
        ))}
      </div>

      <Touch2CarouselDots
        count={count}
        activeIndex={index}
        slideKeys={slides.map((slide) => slide.src)}
        activeProgress={indicatorProgress}
        onSelect={selectSlide}
      />
    </div>
  )
}

export const Touch2Carousel = memo(Touch2CarouselInner)
