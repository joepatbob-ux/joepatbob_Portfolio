'use client'

import { useEffect, useRef, useState } from 'react'

type Phase = 'before' | 'in' | 'out'

interface Props {
  eyebrow: string
  headline: string
  body: string
}

export function CaseStudyOverview({ eyebrow, headline, body }: Props) {
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
      className="case-study-overview"
      data-phase={phase}
      aria-label="Overview"
    >
      <div className="case-study-overview__inner">
        {eyebrow ? (
          <p className="case-study-overview__eyebrow">{eyebrow}</p>
        ) : null}
        <h2 className="case-study-overview__headline">{headline}</h2>
        <div className="case-study-overview__rule" aria-hidden />
        <p className="case-study-overview__body">{body}</p>
      </div>
    </section>
  )
}
