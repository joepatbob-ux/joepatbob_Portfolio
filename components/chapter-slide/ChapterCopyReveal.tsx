import { ChapterCompactReveal } from '@/components/chapter-slide/ChapterCompactReveal'
import { ChapterCopyRevealHeader } from '@/components/chapter-slide/ChapterCopyRevealHeader'
import { ChapterMobileSheet } from '@/components/chapter-slide/ChapterMobileSheet'
import type { ChapterCopyRevealProps } from '@/components/chapter-slide/chapterCopyRevealTypes'
import { useChapterLayoutMode } from '@/lib/hooks/useChapterLayoutMode'

/** Picks mobile sheet vs compact expand from layout mode. Desktop callers use inline copy instead. */
export function ChapterCopyReveal({
  headline,
  subhead,
  align = 'left',
  headerVariant = 'section',
  triggerLabel,
  children,
}: ChapterCopyRevealProps) {
  const mode = useChapterLayoutMode()

  if (mode === 'mobile') {
    return (
      <ChapterMobileSheet
        headline={headline}
        subhead={subhead}
        align={align}
        headerVariant={headerVariant}
        triggerLabel={triggerLabel}
      >
        {children}
      </ChapterMobileSheet>
    )
  }

  if (mode === 'compact') {
    return (
      <ChapterCompactReveal
        headline={headline}
        subhead={subhead}
        align={align}
        headerVariant={headerVariant}
        triggerLabel={triggerLabel}
      >
        {children}
      </ChapterCompactReveal>
    )
  }

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

export type { ChapterCopyRevealProps } from '@/components/chapter-slide/chapterCopyRevealTypes'
