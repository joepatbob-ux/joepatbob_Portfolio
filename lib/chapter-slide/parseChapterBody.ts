/** Split chapter body on blank lines into display paragraphs. */
export function parseChapterBody(body: string | undefined): string[] {
  if (!body) return []
  return body
    .split(/\n\n+/)
    .map((p) => p.trim())
    .filter(Boolean)
}

/** A paragraph that is entirely **bold** acts as an inline subhead. */
export function isSubheadParagraph(paragraph: string): boolean {
  return /^\*\*[^*]+\*\*$/.test(paragraph)
}

/** Strip the bold markers from a subhead paragraph. */
export function subheadText(paragraph: string): string {
  return paragraph.replace(/^\*\*|\*\*$/g, '')
}

export interface ChapterBodyGroup {
  /** null for the intro block before the first subhead */
  subhead: string | null
  paragraphs: string[]
}

/** Group paragraphs under their preceding subhead (intro block first). */
export function groupChapterBody(paragraphs: string[]): ChapterBodyGroup[] {
  const groups: ChapterBodyGroup[] = []
  let current: ChapterBodyGroup = { subhead: null, paragraphs: [] }

  for (const paragraph of paragraphs) {
    if (isSubheadParagraph(paragraph)) {
      if (current.subhead !== null || current.paragraphs.length > 0) {
        groups.push(current)
      }
      current = { subhead: subheadText(paragraph), paragraphs: [] }
    } else {
      current.paragraphs.push(paragraph)
    }
  }
  if (current.subhead !== null || current.paragraphs.length > 0) {
    groups.push(current)
  }
  return groups
}
