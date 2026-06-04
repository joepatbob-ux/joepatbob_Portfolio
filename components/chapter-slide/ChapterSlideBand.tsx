'use client'

import { ChapterCopyScroller } from '@/components/ChapterCopyScroller'
import { ChapterViewport } from '@/components/ChapterViewport'
import { ChapterCompactStageFill } from '@/components/chapter-slide/ChapterCompactStageFill'
import {
  ChapterCompactViewInner,
  ChapterCompactViewProvider,
} from '@/components/chapter-slide/ChapterCompactViewContext'
import { useLayoutCompactBand } from '@/lib/hooks/useLayoutCompactBand'
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
  const isCompactBand = useLayoutCompactBand()
  const usesCompactCopy = isMobile || isCompactBand
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
        <ChapterCompactViewProvider enabled={isCompactBand && !copyOnly}>
          <ChapterCompactViewInner
            className={[
              'chapter-slide__inner',
              copyOnly ? 'chapter-slide__inner--copy-only' : '',
            ]
              .filter(Boolean)
              .join(' ')}
          >
            {copyOnly ? null : (
              <div className="chapter-slide__stage">
                {isCompactBand ? (
                  <ChapterCompactStageFill>{stage}</ChapterCompactStageFill>
                ) : (
                  stage
                )}
              </div>
            )}
            <div
              className={[
                'chapter-slide__copy',
                'chapter-copy',
                isFlow ? 'flow-chapter-slide__copy' : '',
                copyOnly
                  ? 'chapter-slide__copy--overview'
                  : usesCompactCopy
                    ? [
                        'mobile-learn-more-copy',
                        isMobile ? 'chapter-slide__copy--mobile-teaser' : '',
                        isCompactBand ? 'chapter-slide__copy--compact-teaser' : '',
                      ]
                        .filter(Boolean)
                        .join(' ')
                    : '',
              ]
                .filter(Boolean)
                .join(' ')}
            >
              {usesCompactCopy ? (
                copy
              ) : (
                <ChapterCopyScroller active={copyScrollActive}>
                  {copy}
                </ChapterCopyScroller>
              )}
            </div>
          </ChapterCompactViewInner>
        </ChapterCompactViewProvider>
      </div>
    </ChapterViewport>
  )
}
