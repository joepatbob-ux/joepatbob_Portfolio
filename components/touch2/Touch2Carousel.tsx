'use client'

import { Touch2CarouselDots } from '@/components/touch2/Touch2CarouselDots'
import { useChapterActive } from '@/lib/chapterActiveContext'
import { fitSlideFrame, type FrameSize } from '@/lib/touch2CarouselFrame'
import { TOUCH2_CAROUSEL_IMAGES } from '@/lib/touch2CarouselImages'
import { memo, useCallback, useEffect, useMemo, useState } from 'react'

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

function Touch2CarouselInner({
  slides = TOUCH2_CAROUSEL_IMAGES,
  className,
  ariaLabel = 'Touch 2 photo gallery',
}: Props) {
  const isActive = useChapterActive()
  const [index, setIndex] = useState(0)
  const [naturalSizes, setNaturalSizes] = useState<
    Record<string, { width: number; height: number }>
  >({})
  const count = slides.length

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
        setNaturalSizes((prev) => {
          if (prev[slide.src]) return prev
          return {
            ...prev,
            [slide.src]: {
              width: img.naturalWidth,
              height: img.naturalHeight,
            },
          }
        })
      }
      img.src = slide.src
    })

    return () => {
      cancelled = true
    }
  }, [isActive, index, count, slides])

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

  const activeSlide = slides[index]

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
            naturalSizes[activeSlide?.src]
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
          {activeSlide ? (
            <figure className="touch2-carousel__slide touch2-carousel__slide--active">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={activeSlide.src}
                alt={activeSlide.alt}
                className="touch2-carousel__img"
                decoding="async"
                draggable={false}
              />
            </figure>
          ) : null}
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

export const Touch2Carousel = memo(Touch2CarouselInner)
