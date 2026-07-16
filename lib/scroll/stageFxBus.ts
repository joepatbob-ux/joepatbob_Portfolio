/**
 * Chapter stage-fx state, published by the continuous-desktop stage writer
 * (applyContinuousStageAlign). Placed stickers and the sticker pile fade on
 * the same beat as their chapter's artifact by reading this instead of raw
 * reveal thresholds — reveal crosses its threshold well before/after the
 * stage actually dissolves.
 */

type Listener = () => void

const visibleByChapter = new Map<string, boolean>()
const listeners = new Set<Listener>()

export function publishChapterStageFx(
  chapterId: string,
  visible: boolean,
): void {
  if (visibleByChapter.get(chapterId) === visible) return
  visibleByChapter.set(chapterId, visible)
  listeners.forEach((listener) => listener())
}

/** undefined = this chapter has no stage machine (overviews, other modes). */
export function chapterStageFxVisible(chapterId: string): boolean | undefined {
  return visibleByChapter.get(chapterId)
}

export function subscribeChapterStageFx(listener: Listener): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}
