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

/** Continuous scroll — linger slightly through the fade to avoid a hard blip. */
export function blurOutFromRevealForContinuous(
  reveal: number,
  maxBlurPx: number,
): { opacity: number; filter: string } {
  const t = Math.max(0, Math.min(1, reveal))
  const opacity = Math.pow(t, 0.82)
  const blurPx = t >= 0.8 ? 0 : (1 - t / 0.8) * maxBlurPx
  return {
    opacity,
    filter: blurPx > 0.2 ? `blur(${blurPx.toFixed(1)}px)` : 'none',
  }
}
