'use client'

import { Touch2CarouselDots } from '@/components/touch2/Touch2CarouselDots'
import { useChapterActive } from '@/lib/chapterActiveContext'
import { TOUCH2_CAROUSEL_IMAGES } from '@/lib/touch2CarouselImages'
import {
  touch2RailMetrics,
  touch2RailMetricsForWidth,
  TOUCH2_DOT_RING,
  TOUCH2_DOT_SLOT_H,
} from '@/lib/touch2/touch2StageMetrics'
import { memo, useCallback, useEffect, useRef, useState } from 'react'

export {
  TOUCH2_FRAME_HEIGHT,
  TOUCH2_FRAME_WIDTH,
} from '@/lib/touch2/touch2StageMetrics'

const AUTO_PLAY_MS = 6200

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
  autoPlayInterval = AUTO_PLAY_MS,
}: Props) {
  const isActive = useChapterActive()
  const [index, setIndex] = useState(0)
  const [progress, setProgress] = useState(0)
  const [paused, setPaused] = useState(false)
  const [reducedMotion, setReducedMotion] = useState(false)
  const rafRef = useRef(0)
  const elapsedRef = useRef(0)
  const count = slides.length

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const sync = () => setReducedMotion(mq.matches)
    sync()
    mq.addEventListener('change', sync)
    return () => mq.removeEventListener('change', sync)
  }, [])

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

  const go = useCallback(
    (delta: number) => {
      elapsedRef.current = 0
      setIndex((i) => (i + delta + count) % count)
      setProgress(0)
    },
    [count],
  )

  const selectSlide = useCallback((i: number) => {
    elapsedRef.current = 0
    setIndex(i)
    setProgress(0)
  }, [])

  const shouldAutoPlay = autoPlay && isActive && !paused && !reducedMotion

  useEffect(() => {
    if (!shouldAutoPlay) return

    const started = performance.now() - elapsedRef.current

    const tick = (now: number) => {
      const elapsed = now - started
      elapsedRef.current = elapsed
      const p = Math.min(1, elapsed / autoPlayInterval)
      setProgress(p)
      if (p >= 1) {
        elapsedRef.current = 0
        setIndex((i) => (i + 1) % count)
        setProgress(0)
        return
      }
      rafRef.current = requestAnimationFrame(tick)
    }

    rafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafRef.current)
  }, [shouldAutoPlay, index, count, autoPlayInterval])

  useEffect(() => {
    if (!isActive) return

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
        e.preventDefault()
        go(-1)
      }
      if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
        e.preventDefault()
        go(1)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isActive, go])

  const showProgressBar = autoPlay && isActive && !reducedMotion
  const indicatorProgress = showProgressBar ? progress : 0
  const rootRef = useRef<HTMLDivElement>(null)
  const [railMetrics, setRailMetrics] = useState(() => touch2RailMetrics(count))

  useEffect(() => {
    const el = rootRef.current
    if (!el || typeof ResizeObserver === 'undefined') {
      setRailMetrics(touch2RailMetrics(count))
      return
    }

    const update = () => {
      const style = getComputedStyle(el)
      const gap =
        parseFloat(style.columnGap) ||
        parseFloat(style.gap) ||
        parseFloat(style.getPropertyValue('--cs-touch2-gap')) ||
        32
      setRailMetrics(
        touch2RailMetricsForWidth(count, el.clientWidth, gap),
      )
    }

    update()
    const observer = new ResizeObserver(update)
    observer.observe(el)
    return () => observer.disconnect()
  }, [count])

  const { railH, slideW, scale } = railMetrics

  return (
    <div
      ref={rootRef}
      className={['touch2-carousel', className].filter(Boolean).join(' ')}
      style={
        {
          '--touch2-rail-h': `${railH}px`,
          '--touch2-slide-w': `${slideW}px`,
          '--touch2-dot-slot-h': `${Math.max(48, Math.round(TOUCH2_DOT_SLOT_H * scale))}px`,
          '--touch2-dot-slot-w': `${Math.max(48, Math.round(TOUCH2_DOT_SLOT_H * scale))}px`,
          '--touch2-dot-active-h': `${Math.max(36, Math.round(56 * scale))}px`,
          '--touch2-dot-active-w': `${Math.max(36, Math.round(56 * scale))}px`,
          '--touch2-dot-ring-size': `${Math.max(28, Math.round(TOUCH2_DOT_RING * scale))}px`,
        } as React.CSSProperties
      }
      role="region"
      aria-roledescription="carousel"
      aria-label={ariaLabel}
      aria-live="polite"
      onPointerEnter={() => setPaused(true)}
      onPointerLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
          setPaused(false)
        }
      }}
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
