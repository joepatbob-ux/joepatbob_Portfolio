// lib/nav.ts — built from section content so labels/ids stay in sync
import { navInsertsAfterChapter } from './chapterInserts'
import { hardware } from './sections/hardware'
import { mobile } from './sections/mobile'
import { webApps } from './sections/webapps'
import { everythingElse } from './sections/everything-else'
import type { NavSection, Section } from './types'

const LESSONS_CHAPTER = { id: 'lessons', label: 'Lessons' } as const

function sectionToNav(section: Section): NavSection {
  const chapters: NavSection['chapters'] = []
  if (
    section.id === 'hardware' ||
    section.id === 'everything-else' ||
    section.id === 'mobile' ||
    section.id === 'web-apps'
  ) {
    chapters.push({ id: 'overview', label: 'Overview' })
  }
  for (const ch of section.chapters) {
    chapters.push({ id: ch.id, label: ch.title })
    for (const insert of navInsertsAfterChapter(section.id, ch.id)) {
      chapters.push({ id: insert.insertId, label: insert.navLabel })
    }
  }
  if (
    section.id !== 'mobile' &&
    section.id !== 'web-apps' &&
    section.id !== 'hardware' &&
    section.id !== 'everything-else'
  ) {
    chapters.push({ ...LESSONS_CHAPTER })
  }

  return {
    id: section.id,
    label: section.label,
    chapters,
  }
}

export const NAV_SECTIONS: NavSection[] = [
  sectionToNav(hardware),
  sectionToNav(mobile),
  sectionToNav(webApps),
  sectionToNav(everythingElse),
]

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
