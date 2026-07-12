export interface ContentDebugField {
  key: string
  label: string
  /** Markdown or component path for reference when saving to repo */
  fileHint: string
  multiline: boolean
}

export interface ContentDebugPage {
  id: string
  label: string
  /** Scroll target — `data-chapter-id` when present */
  chapterId?: string
  fields: ContentDebugField[]
}

export interface ContentDebugState {
  overrides: Record<string, string>
  selectedPageId: string
  followScroll: boolean
}

export interface ContentDebugPackage {
  contentDebug: '1'
  overrides: Record<string, string>
  meta: {
    exportedAt: string
    pageCount: number
    fieldCount: number
  }
}

const STORAGE_KEY = 'contentDebugState'

export function isContentDebugEnabled(): boolean {
  if (typeof window === 'undefined') return false
  if (process.env.NODE_ENV === 'production') return false
  return new URLSearchParams(window.location.search).get('contentDebug') === '1'
}

export function loadContentDebugState(
  defaultPageId: string,
): ContentDebugState {
  const base: ContentDebugState = {
    overrides: {},
    selectedPageId: defaultPageId,
    followScroll: true,
  }
  if (typeof window === 'undefined') return base
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return base
    const parsed = JSON.parse(raw) as Partial<ContentDebugState>
    return {
      overrides:
        parsed.overrides && typeof parsed.overrides === 'object'
          ? parsed.overrides
          : base.overrides,
      selectedPageId:
        typeof parsed.selectedPageId === 'string'
          ? parsed.selectedPageId
          : base.selectedPageId,
      followScroll:
        typeof parsed.followScroll === 'boolean'
          ? parsed.followScroll
          : base.followScroll,
    }
  } catch {
    return base
  }
}

export function saveContentDebugState(state: ContentDebugState): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

export function buildContentDebugPackage(
  overrides: Record<string, string>,
  fieldCount: number,
  pageCount: number,
): ContentDebugPackage {
  return {
    contentDebug: '1',
    overrides,
    meta: {
      exportedAt: new Date().toISOString(),
      pageCount,
      fieldCount,
    },
  }
}

export function formatContentDebugPackage(pkg: ContentDebugPackage): string {
  return JSON.stringify(pkg, null, 2)
}
