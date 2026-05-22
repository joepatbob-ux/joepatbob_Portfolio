'use client'

import { ChapterViewport } from '@/components/ChapterViewport'
import { ChapterSlideCopy } from '@/components/chapter-slide/ChapterSlideCopy'
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
          <ChapterSlideCopy
            active={copyScrollActive}
            headline={lessonTitle}
            body={lessonBody}
            layout="lessons"
            className="section-lessons__copy chapter-slide__copy"
          />
        </div>
      ) : (
        <ChapterSlideCopy
          active={copyScrollActive}
          headline={lessonTitle}
          body={lessonBody}
          layout="lessons"
          className="section-lessons__copy"
        />
      )}
    </ChapterViewport>
  )
}
