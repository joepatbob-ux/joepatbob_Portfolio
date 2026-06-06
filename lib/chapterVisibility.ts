/** Viewport visibility thresholds for in-flow chapter panels (≤1023px). */

/** Below this — hide from assistive tech (`aria-hidden`). */
export const CHAPTER_A11Y_VISIBILITY = 0.05

/** At/above this — mount WebGL, run carousel preload, etc. */
export const CHAPTER_INTERACTIVE_VISIBILITY = 0.12

export function chapterIsAccessible(visibility: number): boolean {
  return visibility >= CHAPTER_A11Y_VISIBILITY
}

export function chapterIsInteractive(
  visibility: number,
  activeSlideId: string | null,
  chapterId: string,
): boolean {
  return (
    visibility >= CHAPTER_INTERACTIVE_VISIBILITY || activeSlideId === chapterId
  )
}
