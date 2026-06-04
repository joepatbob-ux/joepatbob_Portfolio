'use client'

import { CaseStudySectionHeader } from '@/components/case-study/CaseStudySectionHeader'
import { useChapterCompactView } from '@/components/chapter-slide/ChapterCompactViewContext'
import { MobileLearnMoreSheet } from '@/components/mobile/MobileLearnMoreSheet'
import { OverlayActionPill } from '@/components/ui/OverlayActionPill'
import {
  CHAPTER_COMPACT_COLLAPSE_LABEL,
  CHAPTER_COMPACT_EXPAND_LABEL,
} from '@/lib/chapter-slide/compactView'
import { useLayoutCompactBand } from '@/lib/hooks/useLayoutCompactBand'
import { useLayoutMobile } from '@/lib/hooks/useLayoutMobile'
import { useState, type ReactNode } from 'react'

interface Props {
  headline: string
  subhead?: string
  align?: 'left' | 'center'
  /** Flow sections use section header; hardware chapters use chapter copy headline. */
  headerVariant?: 'section' | 'chapter'
  triggerLabel?: string
  children: ReactNode
}

export function MobileLearnMore({
  headline,
  subhead,
  align = 'left',
  headerVariant = 'section',
  triggerLabel = CHAPTER_COMPACT_EXPAND_LABEL,
  children,
}: Props) {
  const isMobile = useLayoutMobile()
  const isCompactBand = useLayoutCompactBand()
  const compactView = useChapterCompactView()
  const usesSheet = isMobile
  const usesCompactExpand = isCompactBand && compactView != null
  const [open, setOpen] = useState(false)

  const accentRule = <div className="chapter-copy__rule" aria-hidden />

  const learnMorePill = (
    <div className="overlay-action-slot">
      <OverlayActionPill
        variant="primary"
        aria-expanded={open}
        onClick={() => setOpen(true)}
      >
        {triggerLabel}
      </OverlayActionPill>
    </div>
  )

  const expandPill = usesCompactExpand ? (
    <div className="overlay-action-slot">
      <OverlayActionPill
        variant={compactView.expanded ? 'secondary' : 'primary'}
        aria-expanded={compactView.expanded}
        onClick={compactView.toggleExpanded}
      >
        {compactView.expanded
          ? CHAPTER_COMPACT_COLLAPSE_LABEL
          : triggerLabel}
      </OverlayActionPill>
    </div>
  ) : null

  const header =
    headerVariant === 'chapter' ? (
      <>
        <h3 className="chapter-copy__headline">{headline}</h3>
        {usesSheet ? learnMorePill : usesCompactExpand ? expandPill : accentRule}
      </>
    ) : (
      <CaseStudySectionHeader
        headline={headline}
        subhead={subhead}
        align={usesCompactExpand ? 'center' : align}
        ruleSlot={
          usesSheet ? learnMorePill : usesCompactExpand ? expandPill : undefined
        }
      />
    )

  if (!usesSheet && !usesCompactExpand) {
    return (
      <>
        {header}
        {children}
      </>
    )
  }

  if (usesCompactExpand) {
    return (
      <div className="mobile-learn-more chapter-compact-view">
        <div className="mobile-learn-more__teaser chapter-compact-view__header">
          {header}
        </div>
        <div className="chapter-compact-view__story" aria-hidden={!compactView.expanded}>
          <div className="chapter-compact-view__story-scroll">{children}</div>
        </div>
      </div>
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
