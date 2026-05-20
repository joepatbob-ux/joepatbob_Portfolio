'use client'

import { ChapterCopyScroller } from '@/components/ChapterCopyScroller'
import { ChapterViewport } from '@/components/ChapterViewport'
import { useChapterNav } from '@/components/ChapterNavProvider'
import { EimPathArt } from '@/components/EimPathArt'
import { useChapterPanelOpacity } from '@/lib/useChapterPanelOpacity'

const CHAPTER_ID = 'hardware-eim'
const DRAW_MS = 3000

const HEADLINE =
  'The thermostat does the talking so the contractor doesn\'t have to do the walking.'
const BODY = `Contractors work in awkward places. Furnaces in basements, compressors outside at the unit, thermostat on the wall somewhere in between. The EIM was Copeland's first Equipment Interface Module, a dual-use unit supporting both indoor and outdoor equipment. Standard pairing required walking to the unit to initiate a process, then walking back to the thermostat to complete it, sometimes multiple trips if the timing didn't line up.

We started the pairing process automatically at boot, so by the time the contractor reached the thermostat, the EIM was already announcing itself. The entire pairing flow, including assigning the unit as indoor or outdoor, happened at the thermostat in a single pass.

We ran an EIM roadshow: live sessions with contractors, hands-on pairing, open feedback. Contractors who had configured HVAC equipment for years noticed without prompting that something that used to require multiple trips was just done at the thermostat. The configuration didn't go away. The contractor just never had to leave the thermostat to do it.`

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
