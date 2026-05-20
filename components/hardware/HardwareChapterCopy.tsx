'use client'

import { ChapterCopyScroller } from '@/components/ChapterCopyScroller'
import { parseChapterBody } from '@/lib/hardware/parseChapterBody'

interface Props {
  active: boolean
  headline: string
  body: string
  className?: string
}

/** Headline, accent rule, and scrollable body — shared across hardware chapters. */
export function HardwareChapterCopy({
  active,
  headline,
  body,
  className,
}: Props) {
  const paragraphs = parseChapterBody(body)

  return (
    <div
      className={['hardware-chapter__copy', 'chapter-copy', className]
        .filter(Boolean)
        .join(' ')}
    >
      <ChapterCopyScroller active={active}>
        <h3 className="chapter-copy__headline">{headline}</h3>
        <div className="chapter-copy__rule" aria-hidden />
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
