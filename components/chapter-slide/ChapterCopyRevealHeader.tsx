'use client'

import { CaseStudySectionHeader } from '@/components/case-study/CaseStudySectionHeader'
import type { ReactNode } from 'react'

interface Props {
  headline: string
  subhead?: string
  align?: 'left' | 'center'
  headerVariant?: 'section' | 'chapter'
  ruleSlot?: ReactNode
}

export function ChapterCopyRevealHeader({
  headline,
  subhead,
  align = 'left',
  headerVariant = 'section',
  ruleSlot,
}: Props) {
  if (headerVariant === 'chapter') {
    return (
      <>
        <h3 className="chapter-copy__headline">{headline}</h3>
        {ruleSlot ?? <div className="chapter-copy__rule" aria-hidden />}
      </>
    )
  }

  return (
    <CaseStudySectionHeader
      headline={headline}
      subhead={subhead}
      align={align}
      ruleSlot={ruleSlot}
    />
  )
}
