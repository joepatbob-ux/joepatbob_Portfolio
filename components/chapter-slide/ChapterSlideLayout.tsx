'use client'

import { ChapterViewport } from '@/components/ChapterViewport'
import { ChapterCompactStageFill } from '@/components/chapter-slide/ChapterCompactStageFill'
import { ChapterSlideCopy } from '@/components/chapter-slide/ChapterSlideCopy'
import { ChapterSlideShell } from '@/components/chapter-slide/ChapterSlideShell'
import { InteractiveStageCursor } from '@/components/chapter-slide/InteractiveStageCursor'
import { MobileLearnMore } from '@/components/mobile/MobileLearnMore'
import { parseChapterBody } from '@/lib/chapter-slide/parseChapterBody'
import { getChapterCopyColumnClasses } from '@/lib/chapter-slide/layoutMode'
import { useChapterLayoutMode } from '@/lib/hooks/useChapterLayoutMode'
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
  const mode = useChapterLayoutMode()
  const copyScrollActive = useCopyScrollActive(chapterId)
  const bodyParagraphs = parseChapterBody(chapter.body)

  const stageInner = interactiveCursor ? (
    <InteractiveStageCursor ringOverSelector="button[data-lite-hit]">
      {stage}
    </InteractiveStageCursor>
  ) : (
    stage
  )

  const stageElement = (
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
      {mode === 'compact' ? (
        <ChapterCompactStageFill>{stageInner}</ChapterCompactStageFill>
      ) : (
        stageInner
      )}
    </div>
  )

  const copyElement =
    mode === 'desktop' ? (
      <ChapterSlideCopy
        active={copyScrollActive}
        headline={chapter.subtitle}
        body={chapter.body}
      />
    ) : (
      <div
        className={getChapterCopyColumnClasses({ mode })}
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
      <ChapterSlideShell
        mode={mode}
        copyFirst={copyFirst}
        stageElement={stageElement}
        copyElement={copyElement}
      />
    </ChapterViewport>
  )
}
