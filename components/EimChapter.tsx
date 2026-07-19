import { EimPathArt } from '@/components/EimPathArt'
import { ChapterSlideLayout } from '@/components/chapter-slide/ChapterSlideLayout'
import type { Chapter } from '@/lib/types'

const CHAPTER_ID = 'hardware-eim'

interface Props {
  chapter: Chapter
  isLast: boolean
}

export function EimChapter({ chapter, isLast }: Props) {
  // The dash cascade draws itself from scroll position (EimPathArt), so it can't
  // be scrolled past un-drawn and needs no reveal/stage-fx wiring here.
  return (
    <ChapterSlideLayout
      chapter={chapter}
      chapterId={CHAPTER_ID}
      modifier="eim"
      isLast={isLast}
      stageAriaLabel={chapter.imageAlt}
      stage={<EimPathArt />}
    />
  )
}
