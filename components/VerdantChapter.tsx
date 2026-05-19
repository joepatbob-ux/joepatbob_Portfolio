'use client'

import { ChapterViewport } from '@/components/ChapterViewport'
import { VerdantInteractive } from '@/components/VerdantInteractive'
import { useChapterPanelOpacity } from '@/lib/useChapterPanelOpacity'
import { useCallback, useEffect, useState } from 'react'

const CHAPTER_ID = 'hardware-verdant'
const DEFAULT_CHAR = 'ALL'

const HEADLINE = 'Designed for distance.'
const SUBTITLE =
  'Designing for hospitality, distance, and every language at once'
const BODY = `The Verdant VX4 and Line Voltage thermostats serve the hospitality market — guests who speak different languages, interact with the thermostat once, and read it from across a hotel room.

The Line Voltage thermostat for the European market pushed further: I replaced all text labels with iconography. An icon either communicates or it doesn't.

To support the Verdant display, I designed a high-density segment character set from scratch — angled slices with flexible geometry that renders numbers with far greater clarity at distance. Pending US patent.`

interface Props {
  isLast: boolean
}

export function VerdantChapter({ isLast }: Props) {
  const { isActive } = useChapterPanelOpacity(CHAPTER_ID)
  const [selectedCode, setSelectedCode] = useState(DEFAULT_CHAR)

  const reset = useCallback(() => {
    setSelectedCode(DEFAULT_CHAR)
  }, [])

  useEffect(() => {
    if (!isActive) reset()
  }, [isActive, reset])

  return (
    <ChapterViewport
      chapterId={CHAPTER_ID}
      isLast={isLast}
      className="verdant-chapter"
      fillViewport
    >
      <div className="verdant-chapter__viewport">
        <div className="verdant-chapter__stage">
          <VerdantInteractive
            selectedCode={selectedCode}
            onSelectCode={setSelectedCode}
          />
        </div>

        <div className="verdant-chapter__copy chapter-copy">
          <h3 className="chapter-copy__headline">{HEADLINE}</h3>
          <p className="chapter-copy__subtitle">{SUBTITLE}</p>
          <div className="chapter-copy__rule" aria-hidden />
          <p className="chapter-copy__body">{BODY}</p>
        </div>
      </div>
    </ChapterViewport>
  )
}
