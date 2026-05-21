// components/Chapter.tsx
import { ChapterRenderer } from '@/components/chapter-registry'
import type { Chapter as ChapterType } from '@/lib/types'

interface Props {
  chapter: ChapterType
  sectionId: string
  isLast: boolean
}

export function Chapter({ chapter, sectionId, isLast }: Props) {
  return (
    <ChapterRenderer chapter={chapter} sectionId={sectionId} isLast={isLast} />
  )
}
