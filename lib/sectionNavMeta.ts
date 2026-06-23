// Nav tree derived from section manifests — no duplicate labels.
import { hardware } from './sections/hardware'
import { mobile } from './sections/mobile'
import { webApps } from './sections/webapps'
import { everythingElse } from './sections/everything-else'
import type { NavSection, Section } from './types'

const OVERVIEW = { id: 'overview', label: 'Overview' } as const

function navFromSection(section: Section): NavSection {
  return {
    id: section.id,
    label: section.label,
    chapters: [
      OVERVIEW,
      ...section.chapters.map((chapter) => ({ id: chapter.id, label: chapter.title })),
    ],
  }
}

export const SECTION_NAV_META: readonly NavSection[] = [
  navFromSection(hardware),
  navFromSection(mobile),
  navFromSection(webApps),
  navFromSection(everythingElse),
]
