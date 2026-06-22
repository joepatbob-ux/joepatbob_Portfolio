const MIN_DISPLAY_MS = 1800

function preloadImage(url: string): Promise<void> {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => resolve()
    img.onerror = () => resolve()
    img.src = url
  })
}

function heroPortraitUrl(): string {
  if (typeof document === 'undefined') {
    return '/images/PortraitLight_MG_3496-optimized.jpg'
  }
  const theme = document.documentElement.dataset.theme
  if (theme === 'dark') {
    return '/images/PortraitDark_MG_3490-optimized.jpg'
  }
  return '/images/PortraitLight_MG_3496-optimized.jpg'
}

function minDelay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms)
  })
}

/** Gate global preloader dismiss — fonts, hero portrait, and minimum display time. */
export function waitForInitialReady(): Promise<void> {
  return Promise.all([
    document.fonts?.ready ?? Promise.resolve(),
    preloadImage(heroPortraitUrl()),
    minDelay(MIN_DISPLAY_MS),
  ]).then(() => undefined)
}
