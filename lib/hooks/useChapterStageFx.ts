import { useSyncExternalStore } from 'react'
import {
  chapterStageFxVisible,
  subscribeChapterStageFx,
} from '@/lib/scroll/stageFxBus'

/** This chapter's stage-fx visibility; undefined when no stage machine runs. */
export function useChapterStageFx(chapterId: string): boolean | undefined {
  return useSyncExternalStore(
    subscribeChapterStageFx,
    () => chapterStageFxVisible(chapterId),
    // Prerender snapshot: no stage machine has run — consumers fall back to
    // their reveal-threshold path, matching the baked HTML during hydration.
    () => undefined,
  )
}
