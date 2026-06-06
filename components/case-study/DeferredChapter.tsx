'use client'

import { useRef } from 'react'
import { Chapter } from '@/components/Chapter'
import { isDeferredChapter, useChapterMount } from '@/lib/chapterMount'
import type { Chapter as ChapterType } from '@/lib/types'

interface Props {
  chapter: ChapterType
  sectionId: string
  isLast: boolean
}

export function DeferredChapter({ chapter, sectionId, isLast }: Props) {
  const chapterId = `${sectionId}-${chapter.id}`
  const rootRef = useRef<HTMLDivElement>(null)
  const immediate = !isDeferredChapter(chapterId)
  const mounted = useChapterMount(chapterId, rootRef, immediate)

  return (
    <div
      ref={rootRef}
      className="chapter-mount-slot"
      data-chapter-mount={chapterId}
      style={mounted ? undefined : { minHeight: '100vh' }}
    >
      {mounted ? (
        <Chapter chapter={chapter} sectionId={sectionId} isLast={isLast} />
      ) : null}
    </div>
  )
}
