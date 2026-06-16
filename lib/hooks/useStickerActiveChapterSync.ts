'use client'

import { useChapterNav } from '@/components/ChapterNavProvider'
import { useStickers } from '@/components/StickerProvider'
import { useLayoutTopBarNav } from '@/lib/hooks/useLayoutTopBarNav'
import { activeSlideIdPublished } from '@/lib/chapterSlideshow'
import { isContinuousChapters } from '@/lib/continuousChapters'
import { useEffect } from 'react'

/** Set down selected stickers when the viewport chapter changes. */
export function useStickerActiveChapterSync(): void {
  const { activeSlideId } = useChapterNav()
  const topBarNav = useLayoutTopBarNav()
  const inFlowScroll = topBarNav || isContinuousChapters()
  const { selectedInstanceId, placed, selectSticker } = useStickers()

  const effectiveActiveSlideId = inFlowScroll
    ? (activeSlideId ?? activeSlideIdPublished())
    : activeSlideId

  useEffect(() => {
    if (!selectedInstanceId || !effectiveActiveSlideId) return

    const sticker = placed.find((s) => s.instanceId === selectedInstanceId)
    if (!sticker?.chapterId) return

    if (effectiveActiveSlideId !== sticker.chapterId) {
      selectSticker(null)
    }
  }, [
    effectiveActiveSlideId,
    placed,
    selectSticker,
    selectedInstanceId,
  ])
}
