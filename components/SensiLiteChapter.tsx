'use client'

import { ChapterCopyScroller } from '@/components/ChapterCopyScroller'
import { ChapterViewport } from '@/components/ChapterViewport'
import { SensiLiteProto } from '@/components/SensiLiteProto'
import { useChapterPanelOpacity } from '@/lib/useChapterPanelOpacity'

const INTERACTIVE_ID = 'hardware-sensi-lite-interactive'

const HEADLINE = `32 segments.
Three controls.
One chance to get it right.`

interface Props {
  body: string
  isLast: boolean
}

export function SensiLiteChapter({ body, isLast }: Props) {
  const { isActive } = useChapterPanelOpacity('hardware-sensi-lite')

  return (
    <ChapterViewport
      chapterId="hardware-sensi-lite"
      isLast={isLast}
      className="sensi-lite-chapter"
      fillViewport
    >
      <div className="sensi-lite-chapter__viewport">
        <div
          id={INTERACTIVE_ID}
          className="sensi-lite-chapter__stage"
          aria-label="Sensi Lite interactive prototype"
        >
          <SensiLiteProto showControlsLegend={false} />
        </div>

        <div className="sensi-lite-chapter__copy chapter-copy">
          <ChapterCopyScroller active={isActive}>
            <h3 className="chapter-copy__headline">{HEADLINE}</h3>
            <div className="chapter-copy__rule" aria-hidden />
            <p className="chapter-copy__body">{body}</p>
          </ChapterCopyScroller>
        </div>
      </div>
    </ChapterViewport>
  )
}
