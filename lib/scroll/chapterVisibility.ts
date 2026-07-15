/** Viewport visibility thresholds for in-flow chapter panels (≤1023px). */

/** Below this — hide from assistive tech (`aria-hidden`). */
export const CHAPTER_A11Y_VISIBILITY = 0.05

/** At/above this — mount WebGL/canvas DOM (off-screen warm-up). */
export const CHAPTER_INTERACTIVE_VISIBILITY = 0.12

/** At/above this — imperative stage paint + run sims/carousel (continuous desktop). */
export const CHAPTER_STAGE_PAINT_VISIBILITY = 0.22

/** Placed stickers enter/exit with the rest of the chapter choreography —
 * same reveal line as the stage artifact and the pile, so nothing lingers
 * after the chapter has dissolved out. */
export const CHAPTER_STICKER_SCROLL_VISIBILITY = CHAPTER_STAGE_PAINT_VISIBILITY

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

/** Continuous desktop — stage visible and chapter "active" for sims/preload. */
export function chapterIsStagePainted(
  stageReveal: number,
  copyReveal: number,
): boolean {
  return (
    stageReveal >= CHAPTER_STAGE_PAINT_VISIBILITY ||
    copyReveal >= CHAPTER_STAGE_PAINT_VISIBILITY
  )
}

export function chapterIsContinuousActive(
  copyReveal: number,
  activeSlideId: string | null,
  chapterId: string,
): boolean {
  return (
    copyReveal >= CHAPTER_STAGE_PAINT_VISIBILITY || activeSlideId === chapterId
  )
}
