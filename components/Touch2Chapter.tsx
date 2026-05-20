'use client'

import type { Chapter as ChapterType } from '@/lib/types'
import { ChapterCopyScroller } from '@/components/ChapterCopyScroller'
import { ChapterViewport } from '@/components/ChapterViewport'
import { LavaLampCarousel } from '@/components/LavaLampCarousel'
import { useChapterPanelOpacity } from '@/lib/useChapterPanelOpacity'

interface Props {
  chapter: ChapterType
  isLast: boolean
}

export function Touch2Chapter({ chapter, isLast }: Props) {
  const { isActive } = useChapterPanelOpacity('hardware-touch-2')

  return (
    <ChapterViewport
      chapterId="hardware-touch-2"
      isLast={isLast}
      className="touch-2-chapter"
      fillViewport
    >
      <div className="touch-2-chapter__viewport">
        <div className="touch-2-chapter__copy chapter-copy">
          <ChapterCopyScroller active={isActive}>
            <h3 className="chapter-copy__headline">{chapter.subtitle}</h3>
            <div className="chapter-copy__rule" aria-hidden />
            <p className="chapter-copy__body">{chapter.body}</p>
          </ChapterCopyScroller>
        </div>

        <div className="touch-2-chapter__stage">
          <LavaLampCarousel />
        </div>
      </div>
    </ChapterViewport>
  )
}
