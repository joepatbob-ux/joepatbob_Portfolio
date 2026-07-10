import { ChapterViewport } from '@/components/ChapterViewport'
import { ChapterSlideShell } from '@/components/chapter-slide/ChapterSlideShell'
import { useChapterLayoutMode } from '@/lib/hooks/useChapterLayoutMode'
import { useCopyScrollActive } from '@/lib/useCopyScrollActive'
import type { ReactNode } from 'react'

interface Props {
  chapterId: string
  isLast?: boolean
  fillViewport?: boolean
  className?: string
  modifier?: string
  /** Section overview — copy centered in content area, no stage column. */
  copyOnly?: boolean
  stage?: ReactNode
  stageAriaLabel?: string
  copyClassName?: string
  copy: ReactNode
}

/**
 * Hardware-style chapter band: fixed viewport panel with stage | copy.
 */
export function ChapterSlideBand({
  chapterId,
  isLast,
  fillViewport = true,
  className,
  modifier,
  copyOnly = false,
  stage,
  stageAriaLabel,
  copyClassName,
  copy,
}: Props) {
  const mode = useChapterLayoutMode()
  const copyScrollActive = useCopyScrollActive(chapterId)
  const modClass = modifier ? `chapter-slide--${modifier}` : ''
  const isFlow = className?.includes('flow-chapter-slide') ?? false

  return (
    <ChapterViewport
      chapterId={chapterId}
      isLast={isLast}
      fillViewport={fillViewport}
      className={[
        'chapter-slide',
        'hardware-slideshow',
        modClass,
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <ChapterSlideShell
        mode={mode}
        copyOnly={copyOnly}
        isFlow={isFlow}
        copyScrollActive={copyScrollActive}
        stage={stage}
        stageAriaLabel={stageAriaLabel}
        copyClassName={copyClassName}
        copy={copy}
      />
    </ChapterViewport>
  )
}
