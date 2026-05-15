// lib/nav.ts
import type { NavSection } from './types'

export const NAV_SECTIONS: NavSection[] = [
  {
    id: 'hardware',
    label: 'Hardware',
    chapters: ['touch-2', 'eim', 'sensi-lite', 'verdant', 'trane', 'lessons'],
  },
  {
    id: 'mobile',
    label: 'Mobile',
    chapters: ['strategy', 'color', 'install-flow', 'spotlight', 'wr-connect', 'lessons'],
  },
  {
    id: 'web-apps',
    label: 'Web Apps',
    chapters: ['products', 'problem', 'stakes', 'kelvin', 'rollout', 'lessons'],
  },
  {
    id: 'everything-else',
    label: 'Everything Else',
    chapters: ['who', 'thinking', 'principles', 'background', 'in-between', 'lessons'],
  },
]