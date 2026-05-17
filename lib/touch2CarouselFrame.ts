export interface FrameSize {
  width: number
  height: number
}

/** Fit natural image dimensions inside max bounds (portrait or landscape). */
export function fitSlideFrame(
  naturalW: number,
  naturalH: number,
  maxW: number,
  maxH: number,
): FrameSize {
  if (naturalW <= 0 || naturalH <= 0) {
    return { width: Math.round(maxW * 0.82), height: Math.round(maxH * 0.88) }
  }

  const aspect = naturalW / naturalH
  let width: number
  let height: number

  if (aspect >= 1) {
    width = maxW
    height = width / aspect
    if (height > maxH) {
      height = maxH
      width = height * aspect
    }
  } else {
    height = maxH
    width = height * aspect
    if (width > maxW) {
      width = maxW
      height = width / aspect
    }
  }

  return { width: Math.round(width), height: Math.round(height) }
}
