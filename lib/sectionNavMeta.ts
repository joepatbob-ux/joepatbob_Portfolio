// Slim nav tree — ids + labels only (no chapter body copy).
import type { NavSection } from './types'

const OVERVIEW = { id: 'overview', label: 'Overview' } as const

/** Keep in sync with `lib/sections/*.ts` chapter ids + titles. */
export const SECTION_NAV_META: readonly NavSection[] = [
  {
    id: 'hardware',
    label: 'Hardware',
    chapters: [
      OVERVIEW,
      { id: 'touch-2', label: 'Touch 2' },
      { id: 'eim', label: 'EIM' },
      { id: 'sensi-lite', label: 'Sensi Lite' },
      { id: 'verdant', label: 'Verdant' },
    ],
  },
  {
    id: 'mobile',
    label: 'Mobile',
    chapters: [
      OVERVIEW,
      { id: 'sensi', label: 'Sensi' },
      { id: 'wr-connect', label: 'WR Connect' },
    ],
  },
  {
    id: 'web-apps',
    label: 'Web Apps',
    chapters: [
      OVERVIEW,
      { id: 'kelvin-ds', label: 'Kelvin DS' },
    ],
  },
  {
    id: 'everything-else',
    label: 'Everything In Between',
    chapters: [
      OVERVIEW,
      { id: 'concepts', label: 'Concepts' },
      { id: 'formation', label: 'Formation' },
      { id: 'practice', label: 'Practice' },
    ],
  },
]
