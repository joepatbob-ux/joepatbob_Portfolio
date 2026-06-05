'use client'

import { useChapterCompactView } from '@/components/chapter-slide/ChapterCompactViewContext'
import { ChapterCopyRevealHeader } from '@/components/chapter-slide/ChapterCopyRevealHeader'
import type { ChapterCopyRevealProps } from '@/components/chapter-slide/chapterCopyRevealTypes'
import { OverlayActionPill } from '@/components/ui/OverlayActionPill'
import {
  CHAPTER_COMPACT_COLLAPSE_LABEL,
  CHAPTER_COMPACT_EXPAND_LABEL,
} from '@/lib/chapter-slide/compactView'

/** 768–1199 — headline + More/Less expands story in place (requires compact provider). */
export function ChapterCompactReveal({
  headline,
  subhead,
  align = 'left',
  headerVariant = 'section',
  triggerLabel = CHAPTER_COMPACT_EXPAND_LABEL,
  children,
}: ChapterCopyRevealProps) {
  const compactView = useChapterCompactView()

  if (!compactView) {
    return (
      <>
        <ChapterCopyRevealHeader
          headline={headline}
          subhead={subhead}
          align={align}
          headerVariant={headerVariant}
        />
        {children}
      </>
    )
  }

  const expandPill = (
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
  )

  return (
    <div className="mobile-learn-more chapter-compact-view">
      <div className="mobile-learn-more__teaser chapter-compact-view__header">
        <ChapterCopyRevealHeader
          headline={headline}
          subhead={subhead}
          align="center"
          headerVariant={headerVariant}
          ruleSlot={expandPill}
        />
      </div>
      <div
        className="chapter-compact-view__story"
        aria-hidden={!compactView.expanded}
      >
        <div className="chapter-compact-view__story-scroll">{children}</div>
      </div>
    </div>
  )
}
