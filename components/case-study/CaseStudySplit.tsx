import type { ReactNode } from 'react'

interface Props {
  copy: ReactNode
  stage: ReactNode
  className?: string
  /** Stack stage above copy on narrow viewports (default true). */
  stageFirstOnMobile?: boolean
}

/** Two-column case study band: interactive stage left, copy right. */
export function CaseStudySplit({
  copy,
  stage,
  className,
  stageFirstOnMobile = true,
}: Props) {
  return (
    <div
      className={[
        'case-study-split',
        stageFirstOnMobile ? 'case-study-split--stage-first-mobile' : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <div className="case-study-split__stage">{stage}</div>
      <div className="case-study-split__copy">{copy}</div>
    </div>
  )
}
