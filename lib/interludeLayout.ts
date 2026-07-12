export type InterludeLayout = 'stack' | 'split' | 'sandwich' | 'editorial'

export const INTERLUDE_LAYOUTS: readonly InterludeLayout[] = [
  'stack',
  'split',
  'sandwich',
  'editorial',
] as const

export const INTERLUDE_LAYOUT_LABELS: Record<InterludeLayout, string> = {
  stack: 'Stack — glyphs above copy',
  split: 'Split — glyphs left, copy right',
  sandwich: 'Sandwich — headline, glyphs, body',
  editorial: 'Editorial — copy column beside glyphs',
}

const STORAGE_KEY = 'interludeLayoutPick'

export function isInterludeLayoutPickerEnabled(): boolean {
  if (typeof window === 'undefined') return false
  if (process.env.NODE_ENV === 'production') return false
  return new URLSearchParams(window.location.search).has('interludeLayout')
}

/** True when either layout or copy-style dev pickers should show. */
export function isInterludeDevPickerEnabled(): boolean {
  if (typeof window === 'undefined') return false
  if (process.env.NODE_ENV === 'production') return false
  const params = new URLSearchParams(window.location.search)
  return params.has('interludeLayout') || params.has('interludeCopy')
}

export function readInterludeLayout(): InterludeLayout {
  if (typeof window === 'undefined') return 'stack'
  const param = new URLSearchParams(window.location.search).get('interludeLayout')
  if (param === 'split' || param === 'sandwich' || param === 'editorial') return param
  if (param === '1' || param === 'pick') {
    try {
      const stored = sessionStorage.getItem(STORAGE_KEY)
      if (
        stored === 'split' ||
        stored === 'sandwich' ||
        stored === 'editorial' ||
        stored === 'stack'
      ) {
        return stored
      }
    } catch {
      /* ignore */
    }
  }
  return 'stack'
}

export function saveInterludeLayoutPick(layout: InterludeLayout): void {
  if (typeof window === 'undefined') return
  try {
    sessionStorage.setItem(STORAGE_KEY, layout)
  } catch {
    /* ignore */
  }
}
