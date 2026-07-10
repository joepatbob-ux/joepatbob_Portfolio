import { ChapterCopyScroller } from '@/components/ChapterCopyScroller'
import { ChapterCompactStageFill } from '@/components/chapter-slide/ChapterCompactStageFill'
import { ChapterStageAlign } from '@/components/chapter-slide/ChapterStageAlign'
import { isContinuousChapters } from '@/lib/continuousChapters'
import {
  ChapterCompactViewInner,
  ChapterCompactViewProvider,
} from '@/components/chapter-slide/ChapterCompactViewContext'
import {
  getChapterCopyColumnClasses,
  usesCompactCopyMode,
  type ChapterLayoutMode,
} from '@/lib/chapter-slide/layoutMode'
import type { ReactNode } from 'react'

interface Props {
  mode: ChapterLayoutMode
  /** More/Less expand provider — defaults to compact mode when not copy-only. */
  compactExpand?: boolean
  copyOnly?: boolean
  copyFirst?: boolean
  innerClassName?: string
  isFlow?: boolean
  copyScrollActive?: boolean
  copyClassName?: string
  /** Inner stage content — shell adds `.chapter-slide__stage` wrapper. */
  stage?: ReactNode
  stageAriaLabel?: string
  /** Pre-built stage column (custom id, aria, or always-on stage fill). */
  stageElement?: ReactNode
  /** Inner copy — shell adds column classes and desktop scroller. */
  copy?: ReactNode
  /** Pre-built copy column (custom classes already applied). */
  copyElement?: ReactNode
}

/**
 * Shared stage + copy viewport for hardware and flow chapter slides.
 * Provider, compact expand, teaser classes, and desktop scroller live here once.
 */
export function ChapterSlideShell({
  mode,
  compactExpand,
  copyOnly = false,
  copyFirst = false,
  innerClassName = '',
  isFlow = false,
  copyScrollActive = false,
  copyClassName = '',
  stage,
  stageAriaLabel,
  stageElement,
  copy,
  copyElement,
}: Props) {
  const expandEnabled = compactExpand ?? (mode === 'compact' && !copyOnly)

  const stageColumn =
    stageElement ??
    (copyOnly || stage == null ? null : (
      <div className="chapter-slide__stage" aria-label={stageAriaLabel}>
        <ChapterStageAlign>
          {mode === 'compact' ? (
            <ChapterCompactStageFill>{stage}</ChapterCompactStageFill>
          ) : (
            stage
          )}
        </ChapterStageAlign>
      </div>
    ))

  const copyColumn =
    copyElement ??
    (copy == null ? null : (
      <div
        className={getChapterCopyColumnClasses({
          mode,
          copyOnly,
          isFlow,
          extraClasses: copyClassName,
        })}
      >
        {usesCompactCopyMode(mode) || isContinuousChapters() ? (
          copy
        ) : (
          <ChapterCopyScroller active={copyScrollActive}>{copy}</ChapterCopyScroller>
        )}
      </div>
    ))

  return (
    <div className="chapter-slide__viewport">
      <ChapterCompactViewProvider enabled={expandEnabled}>
        <ChapterCompactViewInner
          className={[
            'chapter-slide__inner',
            copyOnly ? 'chapter-slide__inner--copy-only' : '',
            innerClassName,
          ]
            .filter(Boolean)
            .join(' ')}
        >
          {copyFirst ? (
            <>
              {copyColumn}
              {stageColumn}
            </>
          ) : (
            <>
              {stageColumn}
              {copyColumn}
            </>
          )}
        </ChapterCompactViewInner>
      </ChapterCompactViewProvider>
    </div>
  )
}
