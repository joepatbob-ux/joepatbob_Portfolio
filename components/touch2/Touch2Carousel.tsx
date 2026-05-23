'use client'

import { Touch2CarouselDots } from '@/components/touch2/Touch2CarouselDots'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { fitSlideFrame, type FrameSize } from '@/lib/touch2CarouselFrame'
import { TOUCH2_CAROUSEL_IMAGES } from '@/lib/touch2CarouselImages'

const MAX_FRAME_W = 520
const MAX_FRAME_H = 580
const DEFAULT_FRAME: FrameSize = { width: 400, height: 520 }

interface Slide {
  src: string
  alt: string
}

interface Props {
  slides?: readonly Slide[]
  className?: string
  /** Overrides default “Touch 2 photo gallery” label. */
  ariaLabel?: string
}

export function Touch2Carousel({
  slides = TOUCH2_CAROUSEL_IMAGES,
  className,
  ariaLabel = 'Touch 2 photo gallery',
}: Props) {
  const [index, setIndex] = useState(0)
  const [naturalSizes, setNaturalSizes] = useState<
    Record<string, { width: number; height: number }>
  >({})
  const count = slides.length

  useEffect(() => {
    let cancelled = false

    slides.forEach((slide) => {
      const img = new Image()
      img.decoding = 'async'
      img.onload = () => {
        if (cancelled) return
        setNaturalSizes((prev) => ({
          ...prev,
          [slide.src]: {
            width: img.naturalWidth,
            height: img.naturalHeight,
          },
        }))
      }
      img.src = slide.src
    })

    return () => {
      cancelled = true
    }
  }, [slides])

  const frame = useMemo(() => {
    const natural = naturalSizes[slides[index]?.src]
    if (!natural) return DEFAULT_FRAME
    return fitSlideFrame(natural.width, natural.height, MAX_FRAME_W, MAX_FRAME_H)
  }, [index, naturalSizes, slides])

  const orientation =
    frame.width >= frame.height ? 'landscape' : 'portrait'

  const go = useCallback(
    (delta: number) => {
      setIndex((i) => (i + delta + count) % count)
    },
    [count],
  )

  useEffect(() => {
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
  }, [go])

  return (
    <div
      className={['touch2-carousel', className].filter(Boolean).join(' ')}
      role="region"
      aria-roledescription="carousel"
      aria-label={ariaLabel}
      aria-live="polite"
    >
      <p className="touch2-carousel__sr-status">
        Photo {index + 1} of {count}
      </p>

      <div
        className={[
          'touch2-carousel__slides',
          `touch2-carousel__slides--${orientation}`,
          naturalSizes[slides[index]?.src]
            ? 'touch2-carousel__slides--ready'
            : '',
        ]
          .filter(Boolean)
          .join(' ')}
        style={{
          width: frame.width,
          height: frame.height,
        }}
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
            {/* eslint-disable-next-line @next/next/no-img-element */}
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
        onSelect={setIndex}
      />
    </div>
  )
}
