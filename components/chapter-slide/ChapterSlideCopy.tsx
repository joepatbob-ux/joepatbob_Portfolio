'use client'

import { ChapterCopyScroller } from '@/components/ChapterCopyScroller'
import { parseChapterBody } from '@/lib/chapter-slide/parseChapterBody'

export type ChapterSlideCopyLayout = 'chapter' | 'lessons'

interface Props {
  active: boolean
  headline: string
  body: string
  className?: string
  layout?: ChapterSlideCopyLayout
  /** Layout debug label — must live on this flex/grid child, not a wrapper. */
  chapterLayerId?: string
}

/** Headline, accent rule, and scrollable body — shared across case study slides. */
export function ChapterSlideCopy({
  active,
  headline,
  body,
  className,
  layout = 'chapter',
  chapterLayerId,
}: Props) {
  const paragraphs = parseChapterBody(body)
  const showHeader = headline.trim().length > 0

  return (
    <div
      className={[
        'chapter-slide__copy',
        'chapter-copy',
        layout === 'lessons' ? 'chapter-slide__copy--lessons' : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      {...(chapterLayerId ? { 'data-chapter-layer': chapterLayerId } : {})}
    >
      <ChapterCopyScroller active={active}>
        {showHeader ? (
          <>
            <h3 className="chapter-copy__headline">{headline}</h3>
            <div className="chapter-copy__rule" aria-hidden />
          </>
        ) : null}
        <div className="chapter-slide__body">
          {paragraphs.map((paragraph, index) => (
            <p key={index} className="chapter-copy__body">
              {paragraph}
            </p>
          ))}
        </div>
      </ChapterCopyScroller>
    </div>
  )
}
