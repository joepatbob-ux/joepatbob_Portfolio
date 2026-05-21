const REVEAL_EPSILON = 0.04

export function chapterRevealsChanged(
  prev: Readonly<Record<string, number>>,
  next: Readonly<Record<string, number>>,
): boolean {
  const keys = Array.from(
    new Set([...Object.keys(prev), ...Object.keys(next)]),
  )
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i]
    if (Math.abs((prev[key] ?? 0) - (next[key] ?? 0)) > REVEAL_EPSILON) {
      return true
    }
  }
  return false
}
