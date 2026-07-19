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

/**
 * Drop a chapter's stage-fx state back to "no machine" (undefined). Publishing
 * `false` here would lie — consumers read `false` as "the machine ran and the
 * artifact is off its lock" and skip their reveal-threshold fallback, so on
 * layouts where the continuous machine never runs (mobile / top-bar nav) the
 * companion art would stay dark. The reset/teardown path calls this so those
 * consumers see `undefined` and fall back correctly.
 */
export function clearChapterStageFx(chapterId: string): void {
  if (!visibleByChapter.has(chapterId)) return
  visibleByChapter.delete(chapterId)
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
