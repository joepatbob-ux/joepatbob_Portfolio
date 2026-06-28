/** Structured copy for Everything In Between (Concepts · Formation · Practice). */

import { requireContentRaw } from '@/lib/content/contentModules'
import { parseMarkdownFile } from '@/lib/content/parseMarkdown'
import { parseUxBeliefs } from '@/lib/everything-in-between/parseUxBeliefs'

export const EIB_SECTION_TABS = [
  { id: 'concepts', label: 'Concepts' },
  { id: 'formation', label: 'Formation' },
  { id: 'practice', label: 'Practice' },
] as const

export type EibSectionId = (typeof EIB_SECTION_TABS)[number]['id']

export function eibChapterId(sectionId: EibSectionId): string {
  return `everything-else-${sectionId}`
}

export const EIB_CONCEPT_QUOTES = parseUxBeliefs(
  requireContentRaw('everything-in-between/concepts/bowl-quotes'),
)

type EibChapterMeta = {
  headline: string
  close?: string
  patents?: readonly { number: string; title: string; status: string }[]
}

const concepts = parseMarkdownFile<EibChapterMeta>(
  requireContentRaw('everything-in-between/concepts/chapter'),
)
const formation = parseMarkdownFile<EibChapterMeta>(
  requireContentRaw('everything-in-between/formation/chapter'),
)
const practice = parseMarkdownFile<EibChapterMeta>(
  requireContentRaw('everything-in-between/practice/chapter'),
)

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
