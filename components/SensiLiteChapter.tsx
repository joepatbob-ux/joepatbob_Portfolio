'use client'

import { ChapterViewport } from '@/components/ChapterViewport'
import { SensiLiteProto } from '@/components/SensiLiteProto'

const INTERACTIVE_ID = 'hardware-sensi-lite-interactive'

const HEADLINE = `32 segments.
Three controls.
One chance to get it right.`

const CONTROLS =
  '▲ ▼  adjust setpoint    ●  cycle heat / cool / off'

interface Props {
  body: string
  isLast: boolean
}

export function SensiLiteChapter({ body, isLast }: Props) {
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

        <div className="sensi-lite-chapter__copy">
          <h3 className="sensi-lite-chapter__headline">{HEADLINE}</h3>
          <div className="sensi-lite-chapter__rule" aria-hidden />
          <p className="sensi-lite-chapter__body">{body}</p>
        </div>
      </div>

      <footer className="sensi-lite-chapter__footer">
        <div className="sensi-lite-chapter__footer-rule" aria-hidden />
        <p className="sensi-lite-chapter__controls">{CONTROLS}</p>
      </footer>
    </ChapterViewport>
  )
}
