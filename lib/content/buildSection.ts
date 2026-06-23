import type { Chapter, OverviewMetaItem, Section } from '../types'
import { parseMarkdownFile } from './parseMarkdown'

type SectionMeta = {
  id: string
  label: string
  eyebrow?: string
  headline: string
  overviewMeta?: readonly OverviewMetaItem[]
  lessonTitle?: string
  lessonBody?: string
  chapterOrder?: readonly string[]
  closingQuote?: { quote: string; attribution: string }
}

type ChapterMeta = {
  id: string
  title: string
  subtitle?: string
  imageAlt: string
  imageSrc?: string
  imageLayout?: Chapter['imageLayout']
  imagePosition?: Chapter['imagePosition']
}

export function chapterFromMarkdown(raw: string): Chapter {
  const { meta, body } = parseMarkdownFile<ChapterMeta>(raw)
  return {
    id: meta.id,
    title: meta.title,
    subtitle: meta.subtitle ?? '',
    body,
    imageAlt: meta.imageAlt,
    imageSrc: meta.imageSrc,
    imageLayout: meta.imageLayout ?? 'full-width',
    imagePosition: meta.imagePosition ?? 'left',
  }
}

export function sectionFromMarkdown(sectionRaw: string, chapterRaws: readonly string[]): Section {
  const { meta, body } = parseMarkdownFile<SectionMeta>(sectionRaw)
  const chapters = chapterRaws.map(chapterFromMarkdown)
  return {
    id: meta.id,
    label: meta.label,
    eyebrow: meta.eyebrow ?? '',
    headline: meta.headline,
    overviewBody: body,
    overviewMeta: meta.overviewMeta,
    lessonTitle: meta.lessonTitle ?? '',
    lessonBody: meta.lessonBody ?? '',
    chapters,
    closingQuote: meta.closingQuote,
  }
}
