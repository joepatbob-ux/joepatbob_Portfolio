'use client'

import { ChapterActiveProvider } from '@/lib/chapterActiveContext'
import { ChapterStageMountProvider } from '@/lib/chapterStageMountContext'
import { useChapterPanelOpacity } from '@/lib/useChapterPanelOpacity'
import { memo, useRef, type CSSProperties, type ReactNode } from 'react'

interface Props {
  chapterId: string
  isLast?: boolean
  className?: string
  style?: CSSProperties
  fillViewport?: boolean
  children: ReactNode
  /** In-flow content after the fixed viewport panel (sub-stories, etc.). */
  afterPanel?: ReactNode
}

function ChapterViewportInner({
  chapterId,
  isLast: _isLast,
  className,
  style,
  fillViewport = false,
  children,
  afterPanel,
}: Props) {
  const rootRef = useRef<HTMLElement>(null)
  const { style: panelStyle, isActive, ariaHidden } = useChapterPanelOpacity(chapterId)

  return (
    <ChapterStageMountProvider chapterId={chapterId} rootRef={rootRef}>
      <section
        ref={rootRef}
        data-chapter-id={chapterId}
        className={[
          'portfolio-chapter-slot',
          fillViewport ? 'portfolio-chapter-slot--fill' : '',
          className,
        ]
          .filter(Boolean)
          .join(' ')}
        style={{
          scrollMarginTop: 0,
          minWidth: 0,
          ...style,
        }}
      >
        <div
          className="portfolio-chapter-panel"
          style={panelStyle ?? undefined}
          aria-hidden={ariaHidden}
        >
          <ChapterActiveProvider active={isActive}>
            {children}
          </ChapterActiveProvider>
        </div>
        {afterPanel}
      </section>
    </ChapterStageMountProvider>
  )
}

export const ChapterViewport = memo(ChapterViewportInner)
