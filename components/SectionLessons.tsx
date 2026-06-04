'use client'

import { ChapterViewport } from '@/components/ChapterViewport'
import { ChapterCompactStageFill } from '@/components/chapter-slide/ChapterCompactStageFill'
import {
  ChapterCompactViewInner,
  ChapterCompactViewProvider,
} from '@/components/chapter-slide/ChapterCompactViewContext'
import { ChapterSlideCopy } from '@/components/chapter-slide/ChapterSlideCopy'
import { MobileLearnMore } from '@/components/mobile/MobileLearnMore'
import { parseChapterBody } from '@/lib/chapter-slide/parseChapterBody'
import { useLayoutCopyDrawer } from '@/lib/hooks/useLayoutCopyDrawer'
import { useLayoutMobile } from '@/lib/hooks/useLayoutMobile'
import { useCopyScrollActive } from '@/lib/useCopyScrollActive'
import type { ReactNode } from 'react'

interface Props {
  sectionId: string
  lessonTitle: string
  lessonBody: string
  isLast: boolean
  children?: ReactNode
}

export function SectionLessons({
  sectionId,
  lessonTitle,
  lessonBody,
  isLast,
  children,
}: Props) {
  const chapterId = `${sectionId}-lessons`
  const copyScrollActive = useCopyScrollActive(chapterId)
  const isMobile = useLayoutMobile()
  const isCopyDrawer = useLayoutCopyDrawer()
  const usesCompactCopy = isMobile || isCopyDrawer
  const bodyParagraphs = parseChapterBody(lessonBody)

  const lessonsCopy = usesCompactCopy ? (
    <div
      className={[
        'section-lessons__copy',
        'chapter-slide__copy',
        'chapter-slide__copy--lessons',
        'mobile-learn-more-copy',
        isMobile ? 'chapter-slide__copy--mobile-teaser' : '',
        isCopyDrawer ? 'chapter-slide__copy--drawer-teaser' : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <MobileLearnMore headline={lessonTitle} headerVariant="chapter">
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
      headline={lessonTitle}
      body={lessonBody}
      layout="lessons"
      className="section-lessons__copy chapter-slide__copy"
    />
  )

  return (
    <ChapterViewport
      chapterId={chapterId}
      isLast={isLast}
      fillViewport
      className={[
        'section-lessons',
        sectionId === 'hardware' ? 'hardware-slideshow' : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {children}
      {sectionId === 'hardware' ? (
        <div className="chapter-slide__viewport">
          <ChapterCompactViewProvider enabled={isCopyDrawer && !!children}>
            <ChapterCompactViewInner className="chapter-slide__inner">
              {children ? (
                <div className="chapter-slide__stage">
                  <ChapterCompactStageFill>{children}</ChapterCompactStageFill>
                </div>
              ) : null}
              {lessonsCopy}
            </ChapterCompactViewInner>
          </ChapterCompactViewProvider>
        </div>
      ) : (
        lessonsCopy
      )}
    </ChapterViewport>
  )
}
