/** Build-time index of every markdown file under content/ (Vite raw glob). */

const rawModules = import.meta.glob<string>('../../content/**/*.md', {
  query: '?raw',
  import: 'default',
  eager: true,
})

const CONTENT_BY_PATH = new Map<string, string>()

for (const [modulePath, raw] of Object.entries(rawModules)) {
  const match = modulePath.match(/content\/(.+)\.md$/)
  if (match) CONTENT_BY_PATH.set(match[1], raw)
}

/** @param path Path under `content/` without `.md` (e.g. `hardware/touch-2`). */
export function getContentRaw(path: string): string | undefined {
  return CONTENT_BY_PATH.get(path)
}

export function requireContentRaw(path: string): string {
  const raw = getContentRaw(path)
  if (!raw) throw new Error(`Missing content file: content/${path}.md`)
  return raw
}
