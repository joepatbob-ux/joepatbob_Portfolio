export type InterludeCopyStyle =
  | 'classic'
  | 'overview'
  | 'statement'
  | 'pull'
  | 'rhythm'
  | 'offset'
  | 'columns'
  | 'continuous'

export const INTERLUDE_COPY_STYLES: readonly InterludeCopyStyle[] = [
  'classic',
  'overview',
  'statement',
  'pull',
  'rhythm',
  'offset',
  'columns',
  'continuous',
] as const

export const INTERLUDE_COPY_STYLE_LABELS: Record<InterludeCopyStyle, string> = {
  classic: 'Classic — bold lead + muted support',
  overview: 'Overview — section headline scale',
  statement: 'Statement — tight, one voice',
  pull: 'Pull — accent bar on the support line',
  rhythm: 'Rhythm — headline breaks at the clause',
  offset: 'Offset — indented support line',
  columns: 'Columns — lead and support side by side',
  continuous: 'Continuous — one flowing paragraph',
}

const STORAGE_KEY = 'interludeCopyStylePick'

export function readInterludeCopyStyle(): InterludeCopyStyle {
  if (typeof window === 'undefined') return 'classic'
  const param = new URLSearchParams(window.location.search).get('interludeCopy')
  if (param && isInterludeCopyStyle(param)) return param
  if (param === '1' || param === 'pick') {
    try {
      const stored = sessionStorage.getItem(STORAGE_KEY)
      if (stored && isInterludeCopyStyle(stored)) return stored
    } catch {
      /* ignore */
    }
  }
  return 'classic'
}

function isInterludeCopyStyle(value: string): value is InterludeCopyStyle {
  return (INTERLUDE_COPY_STYLES as readonly string[]).includes(value)
}

export function saveInterludeCopyStylePick(style: InterludeCopyStyle): void {
  if (typeof window === 'undefined') return
  try {
    sessionStorage.setItem(STORAGE_KEY, style)
  } catch {
    /* ignore */
  }
}
