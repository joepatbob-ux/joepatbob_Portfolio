/**
 * Parse UX belief bullets from `content/eib-ux-beliefs.md`.
 * Supports `-`, `*`, `+`, and numbered list lines.
 */
export function parseUxBeliefs(markdown: string): readonly string[] {
  const beliefs: string[] = []

  for (const line of markdown.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    if (trimmed.startsWith('<!--') || trimmed.startsWith('-->')) continue

    const bullet = trimmed.match(/^[-*+]\s+(.+)$/)
    if (bullet) {
      beliefs.push(bullet[1].trim())
      continue
    }

    const numbered = trimmed.match(/^\d+[.)]\s+(.+)$/)
    if (numbered) beliefs.push(numbered[1].trim())
  }

  return beliefs
}
