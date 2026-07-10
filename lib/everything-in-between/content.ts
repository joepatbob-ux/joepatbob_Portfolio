/** Structured copy for Everything In Between (Formation · Practice). */

import { requireContentRaw } from '@/lib/content/contentModules'
import { parseMarkdownFile } from '@/lib/content/parseMarkdown'

export const EIB_SECTION_TABS = [
  { id: 'formation', label: 'Coherence' },
  { id: 'practice', label: 'Beyond the Screen' },
] as const

export type EibSectionId = (typeof EIB_SECTION_TABS)[number]['id']

export function eibChapterId(sectionId: EibSectionId): string {
  return `everything-else-${sectionId}`
}

type EibChapterMeta = {
  headline: string
  close?: string
  patents?: readonly { number: string; title: string; status: string }[]
}

const formation = parseMarkdownFile<EibChapterMeta>(
  requireContentRaw('everything-in-between/formation/chapter'),
)
const practice = parseMarkdownFile<EibChapterMeta>(
  requireContentRaw('everything-in-between/practice/chapter'),
)

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
