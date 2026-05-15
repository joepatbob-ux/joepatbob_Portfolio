// lib/nav.ts — built from section content so labels/ids stay in sync
import { hardware } from './sections/hardware'
import { mobile } from './sections/mobile'
import { webApps } from './sections/webapps'
import { everythingElse } from './sections/everything-else'
import type { NavSection, Section } from './types'

const LESSONS_CHAPTER = { id: 'lessons', label: 'Lessons' } as const

function sectionToNav(section: Section): NavSection {
  return {
    id: section.id,
    label: section.label,
    chapters: [
      ...section.chapters.map((ch) => ({ id: ch.id, label: ch.title })),
      { ...LESSONS_CHAPTER },
    ],
  }
}

export const NAV_SECTIONS: NavSection[] = [
  sectionToNav(hardware),
  sectionToNav(mobile),
  sectionToNav(webApps),
  sectionToNav(everythingElse),
]

/** Match chapter id to section (longest id first for `web-apps`, `everything-else`). */
export function sectionIdForChapter(chapterId: string): string | null {
  const sorted = [...NAV_SECTIONS].sort((a, b) => b.id.length - a.id.length)
  return sorted.find((s) => chapterId.startsWith(`${s.id}-`))?.id ?? null
}
