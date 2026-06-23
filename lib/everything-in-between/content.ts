/** Structured copy for Everything In Between (Concepts · Formation · Practice). */

import bowlQuotesRaw from '@/content/everything-in-between/bowl-quotes.md?raw'
import conceptsRaw from '@/content/everything-in-between/concepts.md?raw'
import formationRaw from '@/content/everything-in-between/formation.md?raw'
import practiceRaw from '@/content/everything-in-between/practice.md?raw'
import { parseMarkdownFile } from '@/lib/content/parseMarkdown'
import { parseUxBeliefs } from '@/lib/everything-in-between/parseUxBeliefs'
import { everythingElse } from '@/lib/sections/everything-else'

export const EIB_SECTION_TABS = [
  { id: 'concepts', label: 'Concepts' },
  { id: 'formation', label: 'Formation' },
  { id: 'practice', label: 'Practice' },
] as const

export type EibSectionId = (typeof EIB_SECTION_TABS)[number]['id']

export function eibChapterId(sectionId: EibSectionId): string {
  return `everything-else-${sectionId}`
}

/** @deprecated Use `everythingElse.overviewBody` from `lib/sections/everything-else`. */
export const EIB_CHAPTER_INTRO = everythingElse.overviewBody

export const EIB_CONCEPT_QUOTES = parseUxBeliefs(bowlQuotesRaw)

type EibChapterMeta = {
  headline: string
  close?: string
  patents?: readonly { number: string; title: string; status: string }[]
}

const concepts = parseMarkdownFile<EibChapterMeta>(conceptsRaw)
const formation = parseMarkdownFile<EibChapterMeta>(formationRaw)
const practice = parseMarkdownFile<EibChapterMeta>(practiceRaw)

export const EIB_CONCEPTS = {
  headline: concepts.meta.headline,
  intro: concepts.body,
  answers: EIB_CONCEPT_QUOTES,
} as const

export const EIB_FORMATION = {
  headline: formation.meta.headline,
  intro: formation.body,
  patents: formation.meta.patents ?? [],
} as const

export const EIB_PRACTICE = {
  headline: practice.meta.headline,
  intro: practice.body,
  close: practice.meta.close ?? '',
} as const
