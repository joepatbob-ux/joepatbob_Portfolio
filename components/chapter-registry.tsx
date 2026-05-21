'use client'

import { BeforeAfterSlider } from '@/components/BeforeAfterSlider'
import { EimChapter } from '@/components/EimChapter'
import { SensiLiteChapter } from '@/components/SensiLiteChapter'
import { StudyChapter } from '@/components/StudyChapter'
import { StickerPile } from '@/components/StickerPile'
import { Touch2Chapter } from '@/components/Touch2Chapter'
import { VerdantChapter } from '@/components/VerdantChapter'
import type { Chapter } from '@/lib/types'
import type { ReactNode } from 'react'

export interface ChapterRenderContext {
  chapter: Chapter
  sectionId: string
  isLast: boolean
}

function fullChapterId(sectionId: string, chapter: Chapter): string {
  return `${sectionId}-${chapter.id}`
}

/** Maps section chapter ids to slide layouts and custom stages. */
export function ChapterRenderer({
  chapter,
  sectionId,
  isLast,
}: ChapterRenderContext): ReactNode {
  const chapterId = fullChapterId(sectionId, chapter)

  switch (chapterId) {
    case 'hardware-sensi-lite':
      return <SensiLiteChapter chapter={chapter} isLast={isLast} />
    case 'hardware-touch-2':
      return <Touch2Chapter chapter={chapter} isLast={isLast} />
    case 'hardware-eim':
      return <EimChapter chapter={chapter} isLast={isLast} />
    case 'hardware-verdant':
      return <VerdantChapter chapter={chapter} isLast={isLast} />
    case 'everything-else-in-between':
      return (
        <StudyChapter
          chapter={chapter}
          sectionId={sectionId}
          isLast={isLast}
          stage={<StickerPile />}
        />
      )
    case 'mobile-color':
      return (
        <StudyChapter
          chapter={chapter}
          sectionId={sectionId}
          isLast={isLast}
          stage={
            <BeforeAfterSlider
              beforeSrc="/images/mobile-android-legacy-fullbleed-orange.png"
              afterSrc="/images/mobile-android-v1-dark-orange-number.png"
              beforeAlt="Legacy full-bleed orange heat mode screen"
              afterAlt="Refined UI with mode color on the temperature number"
            />
          }
        />
      )
    default:
      return (
        <StudyChapter chapter={chapter} sectionId={sectionId} isLast={isLast} />
      )
  }
}
