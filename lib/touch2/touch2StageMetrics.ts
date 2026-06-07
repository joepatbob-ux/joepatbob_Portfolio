/** Touch 2 carousel layout — slide + dot rail (sync Touch2Carousel.tsx, touch2-carousel.css). */

export const TOUCH2_FRAME_WIDTH = 520
export const TOUCH2_FRAME_HEIGHT = 580
export const TOUCH2_DOT_SLOT_H = 80
export const TOUCH2_DOT_GAP = 8
export const TOUCH2_DOT_RING = 40

export type Touch2RailMetrics = {
  railH: number
  slideW: number
  scale: number
}

export function touch2RailMetrics(slideCount: number): Touch2RailMetrics {
  const railH =
    slideCount * TOUCH2_DOT_SLOT_H + (slideCount - 1) * TOUCH2_DOT_GAP
  const slideW = Math.round((railH * TOUCH2_FRAME_WIDTH) / TOUCH2_FRAME_HEIGHT)
  return { railH, slideW, scale: 1 }
}

export function touch2OuterWidth(
  slideCount: number,
  gapPx: number,
  dotRingPx = TOUCH2_DOT_RING,
): number {
  const { slideW } = touch2RailMetrics(slideCount)
  return slideW + gapPx + dotRingPx
}

/** Scale rail + slide to fit `containerWidth` (never upscale above 1). */
export function touch2RailMetricsForWidth(
  slideCount: number,
  containerWidth: number,
  gapPx: number,
  dotRingPx = TOUCH2_DOT_RING,
): Touch2RailMetrics {
  const natural = touch2RailMetrics(slideCount)
  const scalable = natural.slideW + dotRingPx
  const available = containerWidth - gapPx
  if (available <= 0 || scalable <= 0) return natural

  const scale = Math.min(1, available / scalable)
  return {
    railH: Math.max(1, Math.round(natural.railH * scale)),
    slideW: Math.max(1, Math.round(natural.slideW * scale)),
    scale,
  }
}
