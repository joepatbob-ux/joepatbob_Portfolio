'use client'

import { useEffect, useRef, useState } from 'react'
import type { Chapter as ChapterType } from '@/lib/types'
import { LavaLampCarousel } from '@/components/LavaLampCarousel'

type Phase = 'before' | 'in' | 'out'

interface Props {
  chapter: ChapterType
  index: number
  isLast: boolean
}

export function Touch2Chapter({ chapter, index, isLast }: Props) {
  const rootRef = useRef<HTMLElement>(null)
  const [phase, setPhase] = useState<Phase>('before')

  useEffect(() => {
    const el = rootRef.current
    if (!el) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setPhase('in')
        } else {
          setPhase((prev) => (prev === 'before' ? 'before' : 'out'))
        }
      },
      { threshold: 0.2 },
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <section
      ref={rootRef}
      data-chapter-id="hardware-touch-2"
      className="touch-2-chapter"
      data-phase={phase}
      style={{
        borderTop: '1px solid var(--color-rule)',
        borderBottom: isLast ? '1px solid var(--color-rule)' : undefined,
        scrollMarginTop: 24,
      }}
    >
      <div className="touch-2-chapter__viewport">
        <div className="touch-2-chapter__copy">
          <h3 className="touch-2-chapter__headline">{chapter.subtitle}</h3>
          <div className="touch-2-chapter__rule" aria-hidden />
          <p className="touch-2-chapter__body">{chapter.body}</p>
        </div>

        <div className="touch-2-chapter__stage">
          <LavaLampCarousel />
        </div>
      </div>

      <footer className="touch-2-chapter__footer">
        <div className="touch-2-chapter__footer-rule" aria-hidden />
        <p className="touch-2-chapter__footer-meta">
          {String(index + 1).padStart(2, '0')} — {chapter.title}
        </p>
      </footer>
    </section>
  )
}
