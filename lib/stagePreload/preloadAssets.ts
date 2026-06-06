/** Warm browser cache for static assets without blocking the main thread. */
export function preloadFetch(url: string): Promise<void> {
  return fetch(url, { priority: 'low' } as RequestInit)
    .then(() => undefined)
    .catch(() => undefined)
}

export function preloadImage(url: string): Promise<void> {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => resolve()
    img.onerror = () => resolve()
    img.src = url
  })
}

export function preloadImages(urls: readonly string[]): Promise<void[]> {
  return Promise.all(urls.map(preloadImage))
}

export function preloadFetches(urls: readonly string[]): Promise<void[]> {
  return Promise.all(urls.map(preloadFetch))
}
