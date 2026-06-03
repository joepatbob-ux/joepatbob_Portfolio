'use client'

import { CaseStudySectionHeader } from '@/components/case-study/CaseStudySectionHeader'
import { MobileLearnMoreSheet } from '@/components/mobile/MobileLearnMoreSheet'
import { useLayoutMobile } from '@/lib/hooks/useLayoutMobile'
import { useState, type ReactNode } from 'react'

interface Props {
  headline: string
  meta?: readonly { label: string; value: string }[]
  subhead?: string
  align?: 'left' | 'center'
  /** Flow sections use section header; hardware chapters use chapter copy headline. */
  headerVariant?: 'section' | 'chapter'
  triggerLabel?: string
  children: ReactNode
}

export function MobileLearnMore({
  headline,
  meta = [],
  subhead,
  align = 'left',
  headerVariant = 'section',
  triggerLabel = 'More',
  children,
}: Props) {
  const isMobile = useLayoutMobile()
  const [open, setOpen] = useState(false)

  const accentRule = <div className="chapter-copy__rule" aria-hidden />

  const learnMorePill = (
    <button
      type="button"
      className="mobile-learn-more__pill"
      aria-expanded={open}
      onClick={() => setOpen(true)}
    >
      {triggerLabel}
    </button>
  )

  const header =
    headerVariant === 'chapter' ? (
      <>
        <h3 className="chapter-copy__headline">{headline}</h3>
        {isMobile ? learnMorePill : accentRule}
      </>
    ) : (
      <CaseStudySectionHeader
        headline={headline}
        meta={meta}
        subhead={subhead}
        align={align}
        ruleSlot={isMobile ? learnMorePill : undefined}
      />
    )

  if (!isMobile) {
    return (
      <>
        {header}
        {children}
      </>
    )
  }

  return (
    <div className="mobile-learn-more">
      <div className="mobile-learn-more__teaser">{header}</div>
      <MobileLearnMoreSheet
        open={open}
        onClose={() => setOpen(false)}
        title={headline}
      >
        {children}
      </MobileLearnMoreSheet>
    </div>
  )
}
