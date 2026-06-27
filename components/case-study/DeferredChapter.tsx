'use client'

import { Chapter } from '@/components/Chapter'
import { isDeferredChapter } from '@/lib/chapterMount'
import type { Chapter as ChapterType } from '@/lib/types'

interface Props {
  chapter: ChapterType
  sectionId: string
  isLast: boolean
}

export function DeferredChapter({ chapter, sectionId, isLast }: Props) {
  const chapterId = `${sectionId}-${chapter.id}`
  const deferred = isDeferredChapter(chapterId)

  return (
    <div
      className="chapter-mount-slot"
      data-chapter-mount={chapterId}
      style={deferred ? { minHeight: '100vh' } : undefined}
    >
      <Chapter chapter={chapter} sectionId={sectionId} isLast={isLast} />
    </div>
  )
}
