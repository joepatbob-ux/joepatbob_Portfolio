const fired = new Set<string>()

/** Run a preload at most once per key (safe across hooks and scroll re-renders). */
export function preloadOnce(
  key: string,
  fn: () => void | Promise<void>,
): Promise<void> {
  if (fired.has(key)) return Promise.resolve()
  fired.add(key)
  return Promise.resolve(fn())
}
