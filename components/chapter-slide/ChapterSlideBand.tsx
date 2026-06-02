'use client'

import { ChapterCopyScroller } from '@/components/ChapterCopyScroller'
import { ChapterViewport } from '@/components/ChapterViewport'
import { useLayoutMobile } from '@/lib/hooks/useLayoutMobile'
import { useCopyScrollActive } from '@/lib/useCopyScrollActive'
import type { ReactNode } from 'react'

interface Props {
  chapterId: string
  isLast?: boolean
  fillViewport?: boolean
  className?: string
  modifier?: string
  /** Section overview — copy centered in content area, no stage column. */
  copyOnly?: boolean
  stage?: ReactNode
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
  copyOnly = false,
  stage,
  copy,
}: Props) {
  const copyScrollActive = useCopyScrollActive(chapterId)
  const isMobile = useLayoutMobile()
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
        <div
          className={[
            'chapter-slide__inner',
            copyOnly ? 'chapter-slide__inner--copy-only' : '',
          ]
            .filter(Boolean)
            .join(' ')}
        >
          {copyOnly ? null : (
            <div className="chapter-slide__stage">{stage}</div>
          )}
          <div
            className={[
              'chapter-slide__copy',
              'chapter-copy',
              isFlow && !copyOnly ? 'flow-chapter-slide__copy' : '',
              copyOnly
                ? 'chapter-slide__copy--overview'
                : isMobile
                  ? 'chapter-slide__copy--mobile-teaser mobile-learn-more-copy'
                  : '',
            ]
              .filter(Boolean)
              .join(' ')}
          >
            {isMobile ? (
              copy
            ) : (
              <ChapterCopyScroller active={copyScrollActive}>
                {copy}
              </ChapterCopyScroller>
            )}
          </div>
        </div>
      </div>
    </ChapterViewport>
  )
}
