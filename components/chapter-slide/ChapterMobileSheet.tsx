'use client'

import { ChapterCopyRevealHeader } from '@/components/chapter-slide/ChapterCopyRevealHeader'
import type { ChapterCopyRevealProps } from '@/components/chapter-slide/chapterCopyRevealTypes'
import { MobileLearnMoreSheet } from '@/components/mobile/MobileLearnMoreSheet'
import { OverlayActionPill } from '@/components/ui/OverlayActionPill'
import { CHAPTER_COMPACT_EXPAND_LABEL } from '@/lib/chapter-slide/compactView'
import { useState } from 'react'

/** ≤767 — headline + More opens full-screen sheet. */
export function ChapterMobileSheet({
  headline,
  subhead,
  align = 'left',
  headerVariant = 'section',
  triggerLabel = CHAPTER_COMPACT_EXPAND_LABEL,
  children,
}: ChapterCopyRevealProps) {
  const [open, setOpen] = useState(false)

  const morePill = (
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

  return (
    <div className="mobile-learn-more">
      <div className="mobile-learn-more__teaser">
        <ChapterCopyRevealHeader
          headline={headline}
          subhead={subhead}
          align={align}
          headerVariant={headerVariant}
          ruleSlot={morePill}
        />
      </div>
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
