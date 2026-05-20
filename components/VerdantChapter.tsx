'use client'

import { ChapterCopyScroller } from '@/components/ChapterCopyScroller'
import { ChapterViewport } from '@/components/ChapterViewport'
import { VerdantInteractive } from '@/components/VerdantInteractive'
import { useChapterPanelOpacity } from '@/lib/useChapterPanelOpacity'
import { useCallback, useEffect, useState } from 'react'

const CHAPTER_ID = 'hardware-verdant'
const DEFAULT_CHAR = 'ALL'

const HEADLINE = 'Numbers can be delightful too.'
const BODY = `The hospitality market puts a specific kind of pressure on a thermostat. A guest interacts with it once, from across the room, in a language it may not share. It needs to communicate clearly before anyone walks over to touch it.

Customers wanted something that felt premium. The economics pushed back. Fixed segment displays keep cost down in a way LCDs don't, and that tradeoff wasn't going away. The real question was whether a segment display could be designed to not look like one.

Standard 7-segment can't get there. The numerals are recognizable but crude, and distance makes it worse. The 7 is ambiguous. The 1 sits right-justified in its cell, throwing off spacing across multi-digit numbers.

So I designed a new character set from scratch. In a 4-multiplexed display, four segments share a single pin. Add segments to improve a character and you add pins, which adds complexity to the display driver, which adds cost. The display also has to carry a lot beyond temperature digits: mode indicators, fan status, occupancy state, connectivity, battery level, demand response alerts, scheduler status. Every segment added to the character set competes directly with everything else the display needs to show. The design problem wasn't just how characters should look. It was how to get the most legibility out of 21 segments per character while leaving enough headroom in the pin budget for the rest of the display to function.

The answer was angled geometry, sliced forms that break from the horizontal and vertical rigidity of standard 7-segment. The 7 reads cleanly. The 1 centers in its cell. The result reads closer to an LCD without the cost of one. A pending US patent covers the character set.`

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
          <ChapterCopyScroller active={isActive}>
            <h3 className="chapter-copy__headline">{HEADLINE}</h3>
            <div className="chapter-copy__rule" aria-hidden />
            <p className="chapter-copy__body">{BODY}</p>
          </ChapterCopyScroller>
        </div>
      </div>
    </ChapterViewport>
  )
}
