/** Touch 2 carousel layout — slide + dot rail (sync Touch2Carousel.tsx, touch2-carousel.css). */

export const TOUCH2_FRAME_WIDTH = 520
export const TOUCH2_FRAME_HEIGHT = 580
export const TOUCH2_DOT_SLOT_H = 80
export const TOUCH2_DOT_GAP = 8
export const TOUCH2_DOT_RING = 40

export const TOUCH2_DOT_ACTIVE = 56

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

/** CSS custom properties for dot ring / slot / active pill (sync Touch2Carousel.tsx). */
export function touch2DotCssMetrics(scale: number): Record<string, string> {
  return {
    '--touch2-dot-slot-h': `${Math.max(48, Math.round(TOUCH2_DOT_SLOT_H * scale))}px`,
    '--touch2-dot-slot-w': `${Math.max(48, Math.round(TOUCH2_DOT_SLOT_H * scale))}px`,
    '--touch2-dot-active-h': `${Math.max(36, Math.round(TOUCH2_DOT_ACTIVE * scale))}px`,
    '--touch2-dot-active-w': `${Math.max(36, Math.round(TOUCH2_DOT_ACTIVE * scale))}px`,
    '--touch2-dot-ring-size': `${Math.max(28, Math.round(TOUCH2_DOT_RING * scale))}px`,
  }
}

/** Scale horizontal dot rail to fit container (PhoneSwap screenshot cycler). */
export function touch2HorizontalDotsScale(
  containerWidth: number,
  slideCount: number,
  gapPx = TOUCH2_DOT_GAP,
): number {
  const natural =
    slideCount * TOUCH2_DOT_SLOT_H + Math.max(0, slideCount - 1) * gapPx
  if (containerWidth <= 0 || natural <= 0) return 1
  return Math.min(1, containerWidth / natural)
}
