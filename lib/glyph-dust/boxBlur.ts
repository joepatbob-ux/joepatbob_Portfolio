// Separable box blur on RGBA ImageData — deterministic across browsers (unlike
// canvas filter: blur(), which Chrome applies wider than Safari at the same px).

function blurPass(
  src: Uint8ClampedArray,
  dst: Uint8ClampedArray,
  width: number,
  height: number,
  radius: number,
  horizontal: boolean,
): void {
  const r = Math.max(1, Math.round(radius))
  const window = r * 2 + 1

  if (horizontal) {
    for (let y = 0; y < height; y++) {
      const row = y * width
      for (let ch = 0; ch < 4; ch++) {
        let sum = 0
        for (let x = -r; x <= r; x++) {
          const cx = Math.min(width - 1, Math.max(0, x))
          sum += src[(row + cx) * 4 + ch]!
        }
        for (let x = 0; x < width; x++) {
          dst[(row + x) * 4 + ch] = (sum / window) | 0
          const add = x + r + 1
          const sub = x - r
          sum +=
            src[(row + Math.min(width - 1, add)) * 4 + ch]! -
            src[(row + Math.max(0, sub)) * 4 + ch]!
        }
      }
    }
    return
  }

  for (let x = 0; x < width; x++) {
    for (let ch = 0; ch < 4; ch++) {
      let sum = 0
      for (let y = -r; y <= r; y++) {
        const cy = Math.min(height - 1, Math.max(0, y))
        sum += src[(cy * width + x) * 4 + ch]!
      }
      for (let y = 0; y < height; y++) {
        dst[(y * width + x) * 4 + ch] = (sum / window) | 0
        const add = y + r + 1
        const sub = y - r
        sum +=
          src[(Math.min(height - 1, add) * width + x) * 4 + ch]! -
          src[(Math.max(0, sub) * width + x) * 4 + ch]!
      }
    }
  }
}

/** In-place RGBA box blur; two passes ≈ smooth metaball kernel. */
export function boxBlurRGBA(
  data: Uint8ClampedArray,
  width: number,
  height: number,
  radius: number,
): void {
  if (radius < 0.5 || width < 1 || height < 1) return
  const tmp = new Uint8ClampedArray(data.length)
  blurPass(data, tmp, width, height, radius, true)
  blurPass(tmp, data, width, height, radius, false)
  blurPass(data, tmp, width, height, radius, true)
  blurPass(tmp, data, width, height, radius, false)
}
