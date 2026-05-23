'use client'

import { ChapterViewport } from '@/components/ChapterViewport'
import { ChapterSlideCopy } from '@/components/chapter-slide/ChapterSlideCopy'
import { InteractiveStageCursor } from '@/components/chapter-slide/InteractiveStageCursor'
import { useCopyScrollActive } from '@/lib/useCopyScrollActive'
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
  /** Sensi Lite dot cursor while hovering the stage. */
  interactiveCursor?: boolean
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
  interactiveCursor = false,
}: Props) {
  const copyScrollActive = useCopyScrollActive(chapterId)

  const stageInner = interactiveCursor ? (
    <InteractiveStageCursor ringOverSelector="button[data-lite-hit]">
      {stage}
    </InteractiveStageCursor>
  ) : (
    stage
  )

  const stageEl = (
    <div
      id={stageId}
      className={[
        'chapter-slide__stage',
        interactiveCursor ? 'chapter-slide__stage--interactive' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      aria-label={stageAriaLabel}
    >
      {stageInner}
    </div>
  )

  const copyEl = (
    <ChapterSlideCopy
      active={copyScrollActive}
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
