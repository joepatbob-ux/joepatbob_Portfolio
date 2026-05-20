'use client'

import { ChapterCopyScroller } from '@/components/ChapterCopyScroller'
import { parseChapterBody } from '@/lib/hardware/parseChapterBody'

export type HardwareCopyLayout = 'chapter' | 'lessons'

interface Props {
  active: boolean
  headline: string
  body: string
  className?: string
  layout?: HardwareCopyLayout
}

/** Headline, accent rule, and scrollable body — shared across hardware chapters. */
export function HardwareChapterCopy({
  active,
  headline,
  body,
  className,
  layout = 'chapter',
}: Props) {
  const paragraphs = parseChapterBody(body)
  const showChapterHeader = layout === 'chapter' && headline.trim().length > 0

  return (
    <div
      className={[
        'hardware-chapter__copy',
        'chapter-copy',
        layout === 'lessons' ? 'hardware-chapter__copy--lessons' : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <ChapterCopyScroller active={active}>
        {showChapterHeader ? (
          <>
            <h3 className="chapter-copy__headline">{headline}</h3>
            <div className="chapter-copy__rule" aria-hidden />
          </>
        ) : null}
        <div className="hardware-chapter__body">
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
