'use client'

import { useEffect, useRef, useState } from 'react'
import { SensiLiteProto } from '@/components/SensiLiteProto'

const INTERACTIVE_ID = 'hardware-sensi-lite-interactive'

const HEADLINE = '32 segments. Three controls. One enclosure.'

const CONTROLS =
  '▲ ▼  adjust setpoint    ●  cycle heat / cool / off'

type Phase = 'before' | 'in' | 'out'

interface Props {
  body: string
  isLast: boolean
}

export function SensiLiteChapter({ body, isLast }: Props) {
  const rootRef = useRef<HTMLElement>(null)
  const [phase, setPhase] = useState<Phase>('before')

  useEffect(() => {
    const el = rootRef.current
    if (!el) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setPhase('in')
        } else {
          setPhase((prev) => (prev === 'before' ? 'before' : 'out'))
        }
      },
      { threshold: 0.2 },
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <section
      ref={rootRef}
      data-chapter-id="hardware-sensi-lite"
      className="sensi-lite-chapter"
      data-phase={phase}
      style={{
        borderTop: '1px solid var(--color-rule)',
        borderBottom: isLast ? '1px solid var(--color-rule)' : undefined,
        scrollMarginTop: 24,
      }}
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
    </section>
  )
}
