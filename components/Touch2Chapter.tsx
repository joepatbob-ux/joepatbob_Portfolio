'use client'

import type { Chapter as ChapterType } from '@/lib/types'
import { ChapterViewport } from '@/components/ChapterViewport'
import { LavaLampCarousel } from '@/components/LavaLampCarousel'

interface Props {
  chapter: ChapterType
  index: number
  isLast: boolean
}

export function Touch2Chapter({ chapter, index, isLast }: Props) {
  return (
    <ChapterViewport
      chapterId="hardware-touch-2"
      isLast={isLast}
      className="touch-2-chapter"
      fillViewport
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
    </ChapterViewport>
  )
}
