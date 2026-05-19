'use client'

import { useChapterPanelOpacity } from '@/lib/useChapterPanelOpacity'
import type { CSSProperties, ReactNode } from 'react'

interface Props {
  chapterId: string
  isLast?: boolean
  className?: string
  style?: CSSProperties
  fillViewport?: boolean
  children: ReactNode
}

export function ChapterViewport({
  chapterId,
  isLast,
  className,
  style,
  fillViewport = false,
  children,
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
        {children}
      </div>
    </section>
  )
}
