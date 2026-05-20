// components/Chapter.tsx
import type { Chapter as ChapterType } from '@/lib/types'
import { BeforeAfterSlider } from '@/components/BeforeAfterSlider'
import { StudyChapter } from '@/components/StudyChapter'
import { SensiLiteChapter } from '@/components/SensiLiteChapter'
import { EimChapter } from '@/components/EimChapter'
import { Touch2Chapter } from '@/components/Touch2Chapter'
import { VerdantChapter } from '@/components/VerdantChapter'
import { StickerPile } from '@/components/StickerPile'

interface Props {
  chapter: ChapterType
  sectionId: string
  isLast: boolean
}

export function Chapter({ chapter, sectionId, isLast }: Props) {
  const chapterId = `${sectionId}-${chapter.id}`

  if (chapterId.startsWith('hardware-')) {
    switch (chapterId) {
      case 'hardware-sensi-lite':
        return <SensiLiteChapter chapter={chapter} isLast={isLast} />
      case 'hardware-touch-2':
        return <Touch2Chapter chapter={chapter} isLast={isLast} />
      case 'hardware-eim':
        return <EimChapter chapter={chapter} isLast={isLast} />
      case 'hardware-verdant':
        return <VerdantChapter chapter={chapter} isLast={isLast} />
    }
  }

  if (chapterId === 'everything-else-in-between') {
    return (
      <StudyChapter
        chapter={chapter}
        sectionId={sectionId}
        isLast={isLast}
        stage={<StickerPile />}
      />
    )
  }

  if (chapterId === 'mobile-color') {
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
  }

  return (
    <StudyChapter chapter={chapter} sectionId={sectionId} isLast={isLast} />
  )
}
