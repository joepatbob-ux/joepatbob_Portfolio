import { ChapterSlideLayout } from '@/components/chapter-slide/ChapterSlideLayout'
import { VerdantInteractive } from '@/components/VerdantInteractive'
import { useChapterPanelOpacity } from '@/lib/useChapterPanelOpacity'
import type { Chapter } from '@/lib/types'

const CHAPTER_ID = 'hardware-verdant'

interface Props {
  chapter: Chapter
  isLast: boolean
}

export function VerdantChapter({ chapter, isLast }: Props) {
  const { isActive } = useChapterPanelOpacity(CHAPTER_ID)

  return (
    <ChapterSlideLayout
      chapter={chapter}
      chapterId={CHAPTER_ID}
      modifier="verdant"
      isLast={isLast}
      stageAriaLabel="Verdant segment display prototype"
      stage={<VerdantInteractive isActive={isActive} />}
    />
  )
}
