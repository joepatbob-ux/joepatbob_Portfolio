'use client'

import { useCallback, useEffect, useState } from 'react'
import { TOUCH2_CAROUSEL_IMAGES } from '@/lib/touch2CarouselImages'

interface Slide {
  src: string
  alt: string
}

interface Props {
  slides?: readonly Slide[]
  className?: string
}

export function LavaLampCarousel({
  slides = TOUCH2_CAROUSEL_IMAGES,
  className,
}: Props) {
  const [index, setIndex] = useState(0)
  const count = slides.length

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
      aria-label="Touch 2 photo gallery"
      aria-live="polite"
    >
      <p className="touch2-carousel__sr-status">
        Photo {index + 1} of {count}
      </p>

      <div className="touch2-carousel__slides">
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

      <div className="touch2-carousel__dots" role="tablist" aria-label="Choose photo">
        {slides.map((slide, i) => (
          <button
            key={slide.src}
            type="button"
            role="tab"
            aria-selected={i === index}
            aria-label={`Photo ${i + 1} of ${count}`}
            className={[
              'touch2-carousel__dot',
              i === index ? 'touch2-carousel__dot--active' : '',
            ]
              .filter(Boolean)
              .join(' ')}
            onClick={() => setIndex(i)}
          />
        ))}
      </div>
    </div>
  )
}
