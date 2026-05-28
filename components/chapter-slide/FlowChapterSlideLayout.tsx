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
  stage: ReactNode
  /** Copy column — section lead, body, and in-column content (scrolls with below-fold). */
  copy: ReactNode
  /** Full-width blocks after the above-fold stage+copy band (sub-stories, etc.). */
  belowFold?: ReactNode
}

/**
 * In-flow case study band — same above-fold grid as Hardware
 * (`chapter-slide__viewport` → `chapter-slide__inner` → stage | copy).
 */
export function FlowChapterSlideLayout({
  chapterId,
  isLast,
  fillViewport = true,
  className,
  stage,
  copy,
  belowFold,
}: Props) {
  const copyScrollActive = useCopyScrollActive(chapterId)

  return (
    <ChapterViewport
      chapterId={chapterId}
      isLast={isLast}
      fillViewport={fillViewport}
      className={['chapter-slide', 'flow-chapter-slide', className]
        .filter(Boolean)
        .join(' ')}
    >
      <ChapterCopyScroller
        active={copyScrollActive}
        className="flow-chapter-slide__panel-scroll mobile-chapter-panel__scroll"
      >
        <div className="flow-chapter-slide__content mobile-chapter-panel__content">
          <div className="chapter-slide__viewport flow-chapter-slide__viewport">
            <div className="chapter-slide__inner">
              <div className="chapter-slide__stage">{stage}</div>
              <div className="chapter-slide__copy chapter-copy flow-chapter-slide__copy">
                {copy}
              </div>
            </div>
          </div>
          {belowFold ? (
            <div className="flow-chapter-slide__below">{belowFold}</div>
          ) : null}
        </div>
      </ChapterCopyScroller>
    </ChapterViewport>
  )
}
