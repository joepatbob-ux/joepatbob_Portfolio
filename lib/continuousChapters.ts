/** Default continuous-scroll mode. OFF = production fixed-panel slideshow. */
export const CONTINUOUS_CHAPTERS_DEFAULT = false

export const CONTINUOUS_CHAPTERS_CLASS = 'continuous-chapters'

/** True when `html.continuous-chapters` is present (set at boot). */
export function isContinuousChapters(): boolean {
  if (typeof document === 'undefined') return CONTINUOUS_CHAPTERS_DEFAULT
  return document.documentElement.classList.contains(CONTINUOUS_CHAPTERS_CLASS)
}

/** Apply `html.continuous-chapters` from default constant and `?continuous=1`. */
export function initContinuousChaptersClass(): void {
  if (typeof document === 'undefined') return

  let enabled = CONTINUOUS_CHAPTERS_DEFAULT
  try {
    if (new URLSearchParams(window.location.search).get('continuous') === '1') {
      enabled = true
    }
  } catch {
    /* ignore malformed location */
  }

  if (enabled) {
    document.documentElement.classList.add(CONTINUOUS_CHAPTERS_CLASS)
  }
}
