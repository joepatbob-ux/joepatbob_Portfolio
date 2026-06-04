import type { ReactNode } from 'react'

interface Props {
  headline: string
  subhead?: string
  align?: 'left' | 'center'
  className?: string
  /** Replaces the accent rule (e.g. mobile “Learn more” link). */
  ruleSlot?: ReactNode
}

/** Shared section / chapter headline block for flow case studies. */
export function CaseStudySectionHeader({
  headline,
  subhead,
  align = 'left',
  className,
  ruleSlot,
}: Props) {
  const rootClass = [
    'case-study-section-header',
    'mobile-section-header',
    align === 'center' ? 'case-study-section-header--center' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <header className={rootClass}>
      <h2 className="mobile-section-header__headline case-study-section-header__headline">
        {headline.split('\n').map((line, i) => (
          <span key={i} className="mobile-section-header__headline-line">
            {line}
          </span>
        ))}
      </h2>
      {subhead ? (
        <p className="case-study-section-header__subhead">{subhead}</p>
      ) : null}
      {ruleSlot ?? (
        <div className="mobile-section-header__rule case-study-section-header__rule" aria-hidden />
      )}
    </header>
  )
}
