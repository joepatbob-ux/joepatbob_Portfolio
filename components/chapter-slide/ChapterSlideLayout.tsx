'use client'

import { ChapterViewport } from '@/components/ChapterViewport'
import { ChapterSlideCopy } from '@/components/chapter-slide/ChapterSlideCopy'
import { useChapterPanelOpacity } from '@/lib/useChapterPanelOpacity'
import type { Chapter } from '@/lib/types'
import type { ReactNode } from 'react'

interface Props {
  chapter: Chapter
  chapterId: string
  isLast: boolean
  stage: ReactNode
  /** BEM modifier, e.g. touch-2, eim, full-width */
  modifier?: string
  stageId?: string
  stageAriaLabel?: string
  /** DOM order: stage before copy (default) or copy before stage. */
  copyFirst?: boolean
}

export function ChapterSlideLayout({
  chapter,
  chapterId,
  isLast,
  stage,
  modifier,
  stageId,
  stageAriaLabel,
  copyFirst = false,
}: Props) {
  const { isActive } = useChapterPanelOpacity(chapterId)

  const stageEl = (
    <div
      id={stageId}
      className="chapter-slide__stage"
      aria-label={stageAriaLabel}
    >
      {stage}
    </div>
  )

  const copyEl = (
    <ChapterSlideCopy
      active={isActive}
      headline={chapter.subtitle}
      body={chapter.body}
    />
  )

  const modClass = modifier ? `chapter-slide--${modifier}` : ''
  const hardwareSlideshow = chapterId.startsWith('hardware-')

  return (
    <ChapterViewport
      chapterId={chapterId}
      isLast={isLast}
      className={[
        'chapter-slide',
        modClass,
        hardwareSlideshow ? 'hardware-slideshow' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      fillViewport
    >
      <div className="chapter-slide__viewport">
        <div className="chapter-slide__inner">
          {copyFirst ? (
            <>
              {copyEl}
              {stageEl}
            </>
          ) : (
            <>
              {stageEl}
              {copyEl}
            </>
          )}
        </div>
      </div>
    </ChapterViewport>
  )
}
