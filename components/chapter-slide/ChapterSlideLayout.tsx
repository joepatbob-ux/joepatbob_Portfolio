'use client'

import { ChapterViewport } from '@/components/ChapterViewport'
import { ChapterSlideCopy } from '@/components/chapter-slide/ChapterSlideCopy'
import { InteractiveStageCursor } from '@/components/chapter-slide/InteractiveStageCursor'
import { MobileLearnMore } from '@/components/mobile/MobileLearnMore'
import { chapterLayoutLayer } from '@/lib/chapter-layout-ghost'
import { parseChapterBody } from '@/lib/chapter-slide/parseChapterBody'
import { useLayoutMobile } from '@/lib/hooks/useLayoutMobile'
import { useCopyScrollActive } from '@/lib/useCopyScrollActive'
import type { Chapter } from '@/lib/types'
import type { ReactNode } from 'react'

interface Props {
  chapter: Chapter
  chapterId: string
  isLast: boolean
  stage: ReactNode
  modifier?: string
  stageId?: string
  stageAriaLabel?: string
  copyFirst?: boolean
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
  const isMobile = useLayoutMobile()
  const bodyParagraphs = parseChapterBody(chapter.body)

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
      data-chapter-layer={chapterLayoutLayer(chapterId, 'stage')}
      aria-label={stageAriaLabel}
    >
      {stageInner}
    </div>
  )

  const copyEl = isMobile ? (
    <div
      className="chapter-slide__copy chapter-copy chapter-slide__copy--mobile-teaser mobile-learn-more-copy"
      data-chapter-layer={chapterLayoutLayer(chapterId, 'copy')}
    >
      <MobileLearnMore headline={chapter.subtitle} headerVariant="chapter">
        <div className="chapter-slide__body">
          {bodyParagraphs.map((paragraph, index) => (
            <p key={index} className="chapter-copy__body">
              {paragraph}
            </p>
          ))}
        </div>
      </MobileLearnMore>
    </div>
  ) : (
    <ChapterSlideCopy
      active={copyScrollActive}
      headline={chapter.subtitle}
      body={chapter.body}
      chapterLayerId={chapterLayoutLayer(chapterId, 'copy')}
    />
  )

  const modClass = modifier ? `chapter-slide--${modifier}` : ''

  return (
    <ChapterViewport
      chapterId={chapterId}
      isLast={isLast}
      className={['chapter-slide', modClass, 'hardware-slideshow']
        .filter(Boolean)
        .join(' ')}
      fillViewport
    >
      <div
        className="chapter-slide__viewport"
        data-chapter-layer={chapterLayoutLayer(chapterId, 'viewport')}
      >
        <div
          className="chapter-slide__inner"
          data-chapter-layer={chapterLayoutLayer(chapterId, 'inner')}
        >
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
