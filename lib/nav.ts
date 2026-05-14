// lib/nav.ts
import type { NavSection } from './types'

export const NAV_SECTIONS: NavSection[] = [
  {
    id: 'hardware',
    label: 'Hardware',
    chapters: ['Touch 2', 'EIM', 'Sensi Lite', 'Verdant', 'Trane', 'Lessons'],
  },
  {
    id: 'mobile',
    label: 'Mobile',
    chapters: ['Foundation', 'Color', 'Install', 'Spotlight', 'Lessons'],
  },
  {
    id: 'web-apps',
    label: 'Web Apps',
    chapters: ['Context', 'Stakes', 'Kelvin', 'Rollout', 'Lessons'],
  },
  {
    id: 'everything-else',
    label: 'Everything In Between',
    chapters: ['The Small Stuff', 'Team', 'How I Think', 'Lessons'],
  },
]
