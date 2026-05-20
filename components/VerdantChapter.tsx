'use client'

import { ChapterSlideLayout } from '@/components/chapter-slide/ChapterSlideLayout'
import { VerdantInteractive } from '@/components/VerdantInteractive'
import { useChapterPanelOpacity } from '@/lib/useChapterPanelOpacity'
import { useCallback, useEffect, useState } from 'react'
import type { Chapter } from '@/lib/types'

const CHAPTER_ID = 'hardware-verdant'
const DEFAULT_CHAR = 'ALL'

interface Props {
  chapter: Chapter
  isLast: boolean
}

export function VerdantChapter({ chapter, isLast }: Props) {
  const { isActive } = useChapterPanelOpacity(CHAPTER_ID)
  const [selectedCode, setSelectedCode] = useState(DEFAULT_CHAR)

  const reset = useCallback(() => {
    setSelectedCode(DEFAULT_CHAR)
  }, [])

  useEffect(() => {
    if (!isActive) reset()
  }, [isActive, reset])

  return (
    <ChapterSlideLayout
      chapter={chapter}
      chapterId={CHAPTER_ID}
      modifier="verdant"
      isLast={isLast}
      stage={
        <VerdantInteractive
          selectedCode={selectedCode}
          onSelectCode={setSelectedCode}
        />
      }
    />
  )
}
