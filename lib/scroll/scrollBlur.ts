/** Max blur for scroll-driven chapter panels and placed stickers. */
export const SCROLL_BLUR_PX = 12

/** Opacity + blur for scroll-driven blur-out (reveal 0 = hidden/blurred, 1 = sharp/clear). */
export function blurOutFromReveal(
  reveal: number,
  maxBlurPx: number,
): { opacity: number; filter: string } {
  const t = Math.max(0, Math.min(1, reveal))
  const opacity = t
  const blurPx = t > 0.98 ? 0 : (1 - t) * maxBlurPx
  return {
    opacity,
    filter: blurPx > 0.2 ? `blur(${blurPx.toFixed(1)}px)` : 'none',
  }
}

/** Opacity completes here so blur has the rest of the reveal to resolve on
 * solid text. Coupled 1:1 (opacity = t), the unblur-in is invisible: the text
 * is most blurred exactly while it's still transparent, and sharp by the time
 * it's solid enough to see. Letting opacity lead makes the blur a real
 * moment — entering text lands full-strength still soft, then focuses;
 * leaving text softens first, then fades. */
const CONTINUOUS_OPACITY_KNEE = 0.62

/** Continuous scroll — scroll-synced copy opacity and blur. The dial value
 * (?fadeTune=1 "Copy blur") maps 1:1 to the max blur at reveal 0; an earlier
 * hidden 0.55 damping made the dial feel dead and the text blur perceptually
 * vanish under the opacity fade. */
export function blurOutFromRevealForContinuous(
  reveal: number,
  maxBlurPx: number,
): { opacity: number; filter: string } {
  const t = Math.max(0, Math.min(1, reveal))
  const opacity = Math.min(1, t / CONTINUOUS_OPACITY_KNEE)
  const blurPx = t >= 0.94 ? 0 : (1 - t / 0.94) * maxBlurPx
  return {
    opacity,
    filter: blurPx > 0.2 ? `blur(${blurPx.toFixed(1)}px)` : 'none',
  }
}
