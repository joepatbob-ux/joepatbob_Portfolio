import type { Section } from '../types'
import { chapterFromMarkdown, sectionFromParts } from './buildSection'
import { getContentRaw, requireContentRaw } from './contentModules'
import { parseMarkdownFile } from './parseMarkdown'

type SectionMeta = {
  id: string
  label: string
  eyebrow?: string
  headline: string
  chapterOrder?: readonly string[]
  lessonTitle?: string
  lessonBody?: string
  closingQuote?: { quote: string; attribution: string }
  overviewMeta?: Section['overviewMeta']
  overviewBlocks?: Section['overviewBlocks']
}

/**
 * Load a case-study section from `content/{folder}/`.
 * - `section.md` — section nav + overview headline/blocks
 * - `overview.md` — overview chapter body
 * - `{chapterId}.md` or `{chapterId}/chapter.md` — one file per nav chapter
 */
export function loadSection(folder: string): Section {
  const sectionRaw = requireContentRaw(`${folder}/section`)
  const { meta } = parseMarkdownFile<SectionMeta>(sectionRaw)
  const overviewRaw = getContentRaw(`${folder}/overview`) ?? ''
  const overviewBody = overviewRaw
    ? parseMarkdownFile(overviewRaw).body
    : parseMarkdownFile(sectionRaw).body

  const chapterOrder = meta.chapterOrder ?? []
  const chapterRaws = chapterOrder.map((chapterId) => {
    const flat = getContentRaw(`${folder}/${chapterId}`)
    if (flat) return flat
    const nested = getContentRaw(`${folder}/${chapterId}/chapter`)
    if (nested) return nested
    throw new Error(
      `Chapter "${chapterId}" not found under content/${folder}/ (${chapterId}.md or ${chapterId}/chapter.md)`,
    )
  })

  return sectionFromParts(sectionRaw, overviewBody, chapterRaws)
}
