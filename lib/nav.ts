// lib/nav.ts — slim metadata only (full section copy loads with CaseStudy / lazy chapters).
import { navInsertsAfterChapter } from './chapterInserts'
import { SECTION_NAV_META } from './sectionNavMeta'
import type { NavSection } from './types'

function withNavInserts(section: NavSection): NavSection {
  const chapters: NavSection['chapters'] = []
  for (const ch of section.chapters) {
    chapters.push(ch)
    for (const insert of navInsertsAfterChapter(section.id, ch.id)) {
      chapters.push({ id: insert.insertId, label: insert.navLabel })
    }
  }
  return { ...section, chapters }
}

export const NAV_SECTIONS: NavSection[] = SECTION_NAV_META.map(withNavInserts)

/** Punctuation after each nav keyword: Hardware, Mobile, Web Apps, and Everything In Between. */
export function navSectionConnector(index: number, total: number): string {
  if (index >= total - 1) return ''
  if (index === total - 2) return ', and '
  return ', '
}

/** Full main-nav sentence for landmark aria-label (screen readers). */
export function navMainSentenceAriaLabel(): string {
  const body = NAV_SECTIONS.map(
    (sec, i) => sec.label + navSectionConnector(i, NAV_SECTIONS.length),
  ).join('')
  return `I simplify complex systems across ${body}`
}

/** Match chapter id to section (longest id first for `web-apps`, `everything-else`). */
export function sectionIdForChapter(chapterId: string): string | null {
  const sorted = [...NAV_SECTIONS].sort((a, b) => b.id.length - a.id.length)
  return sorted.find((s) => chapterId.startsWith(`${s.id}-`))?.id ?? null
}
