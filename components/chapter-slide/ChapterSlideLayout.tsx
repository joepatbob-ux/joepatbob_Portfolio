'use client'

import { ChapterViewport } from '@/components/ChapterViewport'
import { ChapterCompactStageFill } from '@/components/chapter-slide/ChapterCompactStageFill'
import {
  ChapterCompactViewInner,
  ChapterCompactViewProvider,
} from '@/components/chapter-slide/ChapterCompactViewContext'
import { ChapterSlideCopy } from '@/components/chapter-slide/ChapterSlideCopy'
import { InteractiveStageCursor } from '@/components/chapter-slide/InteractiveStageCursor'
import { MobileLearnMore } from '@/components/mobile/MobileLearnMore'
import { parseChapterBody } from '@/lib/chapter-slide/parseChapterBody'
import { useLayoutCopyDrawer } from '@/lib/hooks/useLayoutCopyDrawer'
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
  const isCopyDrawer = useLayoutCopyDrawer()
  const usesCompactCopy = isMobile || isCopyDrawer
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
      aria-label={stageAriaLabel}
    >
      {isCopyDrawer ? (
        <ChapterCompactStageFill>{stageInner}</ChapterCompactStageFill>
      ) : (
        stageInner
      )}
    </div>
  )

  const copyEl = usesCompactCopy ? (
    <div
      className={[
        'chapter-slide__copy',
        'chapter-copy',
        'mobile-learn-more-copy',
        isMobile ? 'chapter-slide__copy--mobile-teaser' : '',
        isCopyDrawer ? 'chapter-slide__copy--drawer-teaser' : '',
      ]
        .filter(Boolean)
        .join(' ')}
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
      <div className="chapter-slide__viewport">
        <ChapterCompactViewProvider enabled={isCopyDrawer}>
          <ChapterCompactViewInner className="chapter-slide__inner">
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
          </ChapterCompactViewInner>
        </ChapterCompactViewProvider>
      </div>
    </ChapterViewport>
  )
}
