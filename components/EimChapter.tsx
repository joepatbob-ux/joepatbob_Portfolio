'use client'

import { ChapterViewport } from '@/components/ChapterViewport'
import { useChapterNav } from '@/components/ChapterNavProvider'
import { EimPathArt } from '@/components/EimPathArt'
import { useChapterPanelOpacity } from '@/lib/useChapterPanelOpacity'

const CHAPTER_ID = 'hardware-eim'
const DRAW_MS = 3000

const HEADLINE = 'Configuration belongs at the thermostat.'
const SUBTITLE = 'Solving a problem by moving it somewhere better'
const BODY = `The Equipment Interface Module supports both indoor and outdoor HVAC equipment. The challenge: how does a contractor communicate equipment type without traveling back and forth between thermostat and unit?

I moved the configuration to the thermostat. Through a simple pairing flow, the contractor sets location and equipment type once, without leaving. The EIM configures itself accordingly. Contractors noticed immediately.`

interface Props {
  isLast: boolean
}

export function EimChapter({ isLast }: Props) {
  const { phase, targetId } = useChapterNav()
  const { isActive } = useChapterPanelOpacity(CHAPTER_ID)

  /** Start the dash reveal during the slideshow fade-out before scroll lands on EIM. */
  const isEnteringOnOffCycle =
    (phase === 'out' || phase === 'in') && targetId === CHAPTER_ID

  const pathActive = isActive || isEnteringOnOffCycle

  return (
    <ChapterViewport
      chapterId={CHAPTER_ID}
      isLast={isLast}
      className="eim-chapter"
      fillViewport
    >
      <div className="eim-chapter__viewport">
        <div className="eim-chapter__stage">
          <EimPathArt
            active={pathActive}
            triggerDraw={pathActive}
            drawDurationMs={DRAW_MS}
          />
        </div>

        <div className="eim-chapter__copy chapter-copy">
          <h3 className="chapter-copy__headline">{HEADLINE}</h3>
          <p className="chapter-copy__subtitle">{SUBTITLE}</p>
          <div className="chapter-copy__rule" aria-hidden />
          <p className="chapter-copy__body">{BODY}</p>
        </div>
      </div>
    </ChapterViewport>
  )
}
