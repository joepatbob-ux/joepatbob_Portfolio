import { NAV_SECTIONS } from '@/lib/nav'

/**
 * Manual line breaks for the sidebar main nav sentence.
 * Each entry = one visual line.
 */

export type NavMainSentenceLine =
  | { kind: 'text'; id: string; text: string; nowrap?: boolean }
  | {
      kind: 'keywords'
      id: string
      prefix?: string
      sectionIds: readonly [string, ...string[]]
      /** Ink text between keyword i and i+1 (length = sectionIds.length - 1). */
      between?: string[]
      suffix?: string
      nowrap?: boolean
    }

export const DEFAULT_NAV_SENTENCE_LINES: readonly NavMainSentenceLine[] = [
  {
    kind: 'keywords',
    id: 'lead',
    prefix: 'I design connected experiences across ',
    sectionIds: ['hardware', 'mobile', 'web-apps', 'everything-else'],
    between: [', ', ', ', ', and '],
    suffix: '.',
  },
]

const STORAGE_KEY = 'navSentenceLayoutLocked'
const sectionById = new Map(NAV_SECTIONS.map((sec) => [sec.id, sec]))
const sectionsByLabel = [...NAV_SECTIONS].sort(
  (a, b) => b.label.length - a.label.length,
)

export function isNavSentenceEditorEnabled(): boolean {
  if (typeof window === 'undefined') return false
  if (process.env.NODE_ENV === 'production') return false
  return new URLSearchParams(window.location.search).get('navSentence') === '1'
}

export function loadLockedNavSentenceLines(): NavMainSentenceLine[] | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as NavMainSentenceLine[]
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : null
  } catch {
    return null
  }
}

export function saveLockedNavSentenceLines(lines: NavMainSentenceLine[]) {
  if (typeof window === 'undefined') return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(lines))
}

export function clearLockedNavSentenceLines() {
  if (typeof window === 'undefined') return
  localStorage.removeItem(STORAGE_KEY)
}

export function resolveNavSentenceLines(): NavMainSentenceLine[] {
  if (typeof window !== 'undefined' && process.env.NODE_ENV !== 'production') {
    const locked = loadLockedNavSentenceLines()
    if (locked) return locked
  }
  return [...DEFAULT_NAV_SENTENCE_LINES]
}

export function layoutToEditorText(lines: readonly NavMainSentenceLine[]): string {
  return lines
    .map((line) => {
      if (line.kind === 'text') return line.text
      let out = line.prefix ?? ''
      line.sectionIds.forEach((sectionId, index) => {
        const sec = sectionById.get(sectionId)
        if (sec) out += sec.label
        if (index < line.sectionIds.length - 1) {
          out += line.between?.[index] ?? ', '
        }
      })
      if (line.suffix) out += line.suffix
      return out
    })
    .join('\n')
}

function lineIdForIndex(index: number, total: number): string {
  if (index === 0) return 'lead'
  if (index === total - 1) return 'tail'
  if (index === 1 && total === 3) return 'mid'
  return `line-${index}`
}

function findKeywordSpans(line: string) {
  const spans: Array<{
    start: number
    end: number
    sectionId: string
    label: string
  }> = []

  let index = 0
  while (index < line.length) {
    let matched: (typeof spans)[number] | null = null
    for (const sec of sectionsByLabel) {
      if (line.slice(index, index + sec.label.length) === sec.label) {
        matched = {
          start: index,
          end: index + sec.label.length,
          sectionId: sec.id,
          label: sec.label,
        }
        break
      }
    }
    if (!matched) {
      index += 1
      continue
    }
    spans.push(matched)
    index = matched.end
  }

  return spans
}

export function parseEditorText(text: string): NavMainSentenceLine[] {
  const rows = text
    .replace(/\r\n/g, '\n')
    .split('\n')
    .map((line) => line.trimEnd())

  while (rows.length > 0 && rows[rows.length - 1] === '') rows.pop()

  return rows.map((line, index) => {
    const id = lineIdForIndex(index, rows.length)
    const spans = findKeywordSpans(line)
    if (spans.length === 0) {
      return { kind: 'text' as const, id, text: line }
    }

    const between: string[] = []
    for (let i = 0; i < spans.length - 1; i++) {
      between.push(line.slice(spans[i]!.end, spans[i + 1]!.start))
    }

    return {
      kind: 'keywords' as const,
      id,
      prefix: line.slice(0, spans[0]!.start) || undefined,
      sectionIds: spans.map((span) => span.sectionId) as [string, ...string[]],
      between: between.length > 0 ? between : undefined,
      suffix: line.slice(spans[spans.length - 1]!.end) || undefined,
    }
  })
}

export function formatLayoutAsTypeScript(lines: readonly NavMainSentenceLine[]): string {
  const body = lines
    .map((line) => {
      if (line.kind === 'text') {
        return `  { kind: 'text', id: '${line.id}', text: '${line.text}' },`
      }
      const prefix = line.prefix ? `\n    prefix: '${line.prefix}',` : ''
      const between =
        line.between && line.between.length > 0
          ? `\n    between: [${line.between.map((s) => `'${s}'`).join(', ')}],`
          : ''
      const suffix = line.suffix ? `\n    suffix: '${line.suffix}',` : ''
      const sectionIds = line.sectionIds.map((id) => `'${id}'`).join(', ')
      return `  {
    kind: 'keywords',
    id: '${line.id}',${prefix}
    sectionIds: [${sectionIds}],${between}${suffix}
  },`
    })
    .join('\n')

  return `export const NAV_MAIN_SENTENCE_LINES = [\n${body}\n] as const`
}

export const NAV_SENTENCE_KEYWORD_HINT = NAV_SECTIONS.map((sec) => sec.label).join(
  ', ',
)
