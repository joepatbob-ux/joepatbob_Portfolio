/** Parse markdown files with JSON frontmatter (`---` … `---` then body). */

export type ParsedMarkdown<T extends Record<string, unknown> = Record<string, unknown>> = {
  meta: T
  body: string
}

export function parseMarkdownFile<T extends Record<string, unknown>>(raw: string): ParsedMarkdown<T> {
  const trimmed = raw.trimStart()
  if (!trimmed.startsWith('---')) {
    return { meta: {} as T, body: trimmed }
  }

  const close = trimmed.indexOf('\n---', 3)
  if (close === -1) {
    throw new Error('Unclosed frontmatter block')
  }

  const json = trimmed.slice(3, close).trim()
  const body = trimmed.slice(close + 4).trim()
  return { meta: JSON.parse(json) as T, body }
}

/** Split body on a horizontal rule into ordered sections (e.g. main + close). */
export function splitBodySections(body: string): readonly string[] {
  return body
    .split(/\n---\n/)
    .map((part) => part.trim())
    .filter(Boolean)
}
