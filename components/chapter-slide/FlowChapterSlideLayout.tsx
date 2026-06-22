'use client'

import { ChapterSlideBand } from '@/components/chapter-slide/ChapterSlideBand'
import type { ReactNode } from 'react'

interface Props {
  chapterId: string
  isLast?: boolean
  fillViewport?: boolean
  className?: string
  stageAriaLabel?: string
  stage: ReactNode
  copy: ReactNode
}

/** Mobile / EIB / Web Apps — same viewport shell as Hardware. */
export function FlowChapterSlideLayout({
  chapterId,
  isLast,
  fillViewport = true,
  className,
  stageAriaLabel,
  stage,
  copy,
}: Props) {
  return (
    <ChapterSlideBand
      chapterId={chapterId}
      isLast={isLast}
      fillViewport={fillViewport}
      className={['flow-chapter-slide', className].filter(Boolean).join(' ')}
      stageAriaLabel={stageAriaLabel}
      stage={stage}
      copy={copy}
    />
  )
}
