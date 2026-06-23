/** Default continuous-scroll mode. OFF = legacy fixed-panel slideshow (`?continuous=0`). */
export const CONTINUOUS_CHAPTERS_DEFAULT = true

export const CONTINUOUS_CHAPTERS_CLASS = 'continuous-chapters'

/** True when `html.continuous-chapters` is present (set at boot). */
export function isContinuousChapters(): boolean {
  if (typeof document === 'undefined') return CONTINUOUS_CHAPTERS_DEFAULT
  return document.documentElement.classList.contains(CONTINUOUS_CHAPTERS_CLASS)
}

/** Apply `html.continuous-chapters` from default constant and `?continuous=` override. */
export function initContinuousChaptersClass(): void {
  if (typeof document === 'undefined') return

  let enabled = CONTINUOUS_CHAPTERS_DEFAULT
  try {
    const param = new URLSearchParams(window.location.search).get('continuous')
    if (param === '1') enabled = true
    if (param === '0') enabled = false
  } catch {
    /* ignore malformed location */
  }

  if (enabled) {
    document.documentElement.classList.add(CONTINUOUS_CHAPTERS_CLASS)
  } else {
    document.documentElement.classList.remove(CONTINUOUS_CHAPTERS_CLASS)
  }
}
