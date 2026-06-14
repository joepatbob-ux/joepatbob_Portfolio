'use client'

import { useRef } from 'react'
import { Chapter } from '@/components/Chapter'
import { isDeferredChapter } from '@/lib/chapterMount'
import { ChapterStageMountProvider } from '@/lib/chapterStageMountContext'
import type { Chapter as ChapterType } from '@/lib/types'

interface Props {
  chapter: ChapterType
  sectionId: string
  isLast: boolean
}

export function DeferredChapter({ chapter, sectionId, isLast }: Props) {
  const chapterId = `${sectionId}-${chapter.id}`
  const rootRef = useRef<HTMLDivElement>(null)
  const deferred = isDeferredChapter(chapterId)

  return (
    <div
      ref={rootRef}
      className="chapter-mount-slot"
      data-chapter-mount={chapterId}
      style={deferred ? { minHeight: '100vh' } : undefined}
    >
      <ChapterStageMountProvider chapterId={chapterId} rootRef={rootRef}>
        <Chapter chapter={chapter} sectionId={sectionId} isLast={isLast} />
      </ChapterStageMountProvider>
    </div>
  )
}
