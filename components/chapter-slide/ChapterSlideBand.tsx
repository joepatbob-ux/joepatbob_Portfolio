'use client'

import { ChapterCopyScroller } from '@/components/ChapterCopyScroller'
import { ChapterViewport } from '@/components/ChapterViewport'
import { useCopyScrollActive } from '@/lib/useCopyScrollActive'
import type { ReactNode } from 'react'

interface Props {
  chapterId: string
  isLast?: boolean
  fillViewport?: boolean
  className?: string
  modifier?: string
  stage: ReactNode
  copy: ReactNode
}

/**
 * Hardware-style chapter band: fixed viewport panel with stage | copy.
 */
export function ChapterSlideBand({
  chapterId,
  isLast,
  fillViewport = true,
  className,
  modifier,
  stage,
  copy,
}: Props) {
  const copyScrollActive = useCopyScrollActive(chapterId)
  const modClass = modifier ? `chapter-slide--${modifier}` : ''
  const isFlow = className?.includes('flow-chapter-slide') ?? false

  return (
    <ChapterViewport
      chapterId={chapterId}
      isLast={isLast}
      fillViewport={fillViewport}
      className={[
        'chapter-slide',
        'hardware-slideshow',
        modClass,
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <div className="chapter-slide__viewport">
        <div className="chapter-slide__inner">
          <div className="chapter-slide__stage">{stage}</div>
          <div
            className={[
              'chapter-slide__copy',
              'chapter-copy',
              isFlow ? 'flow-chapter-slide__copy' : '',
            ]
              .filter(Boolean)
              .join(' ')}
          >
            <ChapterCopyScroller active={copyScrollActive}>
              {copy}
            </ChapterCopyScroller>
          </div>
        </div>
      </div>
    </ChapterViewport>
  )
}
