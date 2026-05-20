'use client'

import { ChapterViewport } from '@/components/ChapterViewport'
import { HardwareChapterCopy } from '@/components/hardware/HardwareChapterCopy'
import { useChapterPanelOpacity } from '@/lib/useChapterPanelOpacity'
import type { Chapter } from '@/lib/types'
import type { ReactNode } from 'react'

export type HardwareChapterVariant = 'sensi-lite' | 'touch-2' | 'eim' | 'verdant'

interface Props {
  chapter: Chapter
  chapterId: string
  variant: HardwareChapterVariant
  isLast: boolean
  stage: ReactNode
  stageId?: string
  stageAriaLabel?: string
  /** DOM order: stage before copy (default) or copy before stage (Touch 2). */
  copyFirst?: boolean
}

export function HardwareChapterLayout({
  chapter,
  chapterId,
  variant,
  isLast,
  stage,
  stageId,
  stageAriaLabel,
  copyFirst = false,
}: Props) {
  const { isActive } = useChapterPanelOpacity(chapterId)

  const stageEl = (
    <div
      id={stageId}
      className="hardware-chapter__stage"
      aria-label={stageAriaLabel}
    >
      {stage}
    </div>
  )

  const copyEl = (
    <HardwareChapterCopy
      active={isActive}
      headline={chapter.subtitle}
      body={chapter.body}
    />
  )

  return (
    <ChapterViewport
      chapterId={chapterId}
      isLast={isLast}
      className={`hardware-chapter hardware-chapter--${variant}`}
      fillViewport
    >
      <div className="hardware-chapter__viewport">
        <div className="hardware-chapter__inner">
          {copyFirst ? (
            <>
              {copyEl}
              {stageEl}
            </>
          ) : (
            <>
              {stageEl}
              {copyEl}
            </>
          )}
        </div>
      </div>
    </ChapterViewport>
  )
}
