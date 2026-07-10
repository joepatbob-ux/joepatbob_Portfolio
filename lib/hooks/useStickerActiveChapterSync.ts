import { useChapterNav } from '@/components/ChapterNavProvider'
import { useStickers } from '@/components/StickerProvider'
import { usePublishedActiveSlideId, usePublishedInHero } from '@/lib/hooks/useChapterReveal'
import { useLayoutTopBarNav } from '@/lib/hooks/useLayoutTopBarNav'
import { isContinuousChapters } from '@/lib/scroll/continuousChapters'
import { useEffect } from 'react'

/** Set down selected stickers when the viewport chapter changes. */
export function useStickerActiveChapterSync(): void {
  const { activeSlideId, phase } = useChapterNav()
  const topBarNav = useLayoutTopBarNav()
  const inFlowScroll = topBarNav || isContinuousChapters()
  const publishedActiveSlideId = usePublishedActiveSlideId()
  const inHero = usePublishedInHero()
  const { selectedInstanceId, placed, selectSticker } = useStickers()

  const effectiveActiveSlideId =
    inFlowScroll && phase === 'idle'
      ? publishedActiveSlideId
      : activeSlideId

  useEffect(() => {
    if (!selectedInstanceId) return

    const sticker = placed.find((s) => s.instanceId === selectedInstanceId)
    if (!sticker?.chapterId) return

    if (
      inHero ||
      !effectiveActiveSlideId ||
      effectiveActiveSlideId !== sticker.chapterId
    ) {
      selectSticker(null)
    }
  }, [
    effectiveActiveSlideId,
    inHero,
    placed,
    selectSticker,
    selectedInstanceId,
  ])
}
