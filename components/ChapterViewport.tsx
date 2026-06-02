'use client'

import { ChapterActiveProvider } from '@/lib/chapterActiveContext'
import { useChapterPanelOpacity } from '@/lib/useChapterPanelOpacity'
import { memo, type CSSProperties, type ReactNode } from 'react'

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
  const { style: panelStyle, isActive } = useChapterPanelOpacity(chapterId)

  return (
    <section
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
        style={panelStyle}
        aria-hidden={!isActive}
      >
        <ChapterActiveProvider active={isActive}>
          {children}
        </ChapterActiveProvider>
      </div>
      {afterPanel}
    </section>
  )
}

export const ChapterViewport = memo(ChapterViewportInner)
