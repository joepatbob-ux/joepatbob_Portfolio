import { ChapterViewport } from '@/components/ChapterViewport'
import { ChapterCompactStageFill } from '@/components/chapter-slide/ChapterCompactStageFill'
import { ChapterStageAlign } from '@/components/chapter-slide/ChapterStageAlign'
import { ChapterSlideCopy } from '@/components/chapter-slide/ChapterSlideCopy'
import { ChapterSlideShell } from '@/components/chapter-slide/ChapterSlideShell'
import { ChapterCopyReveal } from '@/components/chapter-slide/ChapterCopyReveal'
import { getChapterCopyColumnClasses } from '@/lib/chapter-slide/layoutMode'
import { parseChapterBody } from '@/lib/chapter-slide/parseChapterBody'
import { useChapterLayoutMode } from '@/lib/hooks/useChapterLayoutMode'
import { useCopyScrollActive } from '@/lib/hooks/useCopyScrollActive'
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
  const mode = useChapterLayoutMode()
  const chapterId = `${sectionId}-lessons`
  const copyScrollActive = useCopyScrollActive(chapterId)
  const bodyParagraphs = parseChapterBody(lessonBody)

  const lessonsCopy =
    mode === 'desktop' ? (
      <ChapterSlideCopy
        active={copyScrollActive}
        headline={lessonTitle}
        body={lessonBody}
        layout="lessons"
        className="section-lessons__copy chapter-slide__copy"
      />
    ) : (
      <div
        className={getChapterCopyColumnClasses({
          mode,
          extraClasses: [
            'section-lessons__copy',
            'chapter-slide__copy--lessons',
          ],
        })}
      >
        <ChapterCopyReveal headline={lessonTitle} headerVariant="chapter">
          <div className="chapter-slide__body">
            {bodyParagraphs.map((paragraph, index) => (
              <p key={index} className="chapter-copy__body">
                {paragraph}
              </p>
            ))}
          </div>
        </ChapterCopyReveal>
      </div>
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
        <ChapterSlideShell
          mode={mode}
          compactExpand={mode === 'compact' && !!children}
          stageElement={
            children ? (
              <div className="chapter-slide__stage">
                <ChapterStageAlign>
                  <ChapterCompactStageFill>{children}</ChapterCompactStageFill>
                </ChapterStageAlign>
              </div>
            ) : undefined
          }
          copyElement={lessonsCopy}
        />
      ) : (
        lessonsCopy
      )}
    </ChapterViewport>
  )
}
