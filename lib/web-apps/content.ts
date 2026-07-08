/** Structured copy for Web Apps — single Kelvin DS chapter. */

import { requireContentRaw } from '@/lib/content/contentModules'
import { parseMarkdownFile } from '@/lib/content/parseMarkdown'

type KelvinIntroMeta = {
  chapterId: string
  headline: string
  subhead: string
  ndaNote: string
}

const kelvinIntro = parseMarkdownFile<KelvinIntroMeta>(
  requireContentRaw('web-apps/kelvin-ds/intro'),
)

// Body splits on a horizontal rule: visible prose, then the expandable facts.
const [kelvinProse, kelvinFacts] = kelvinIntro.body
  .split(/\n---\n/)
  .map((part) => part.trim())

export const WEB_APPS_KELVIN_CHAPTER_ID = kelvinIntro.meta.chapterId

export const WEB_APPS_KELVIN = {
  headline: kelvinIntro.meta.headline,
  subhead: kelvinIntro.meta.subhead,
  ndaNote: kelvinIntro.meta.ndaNote,
  prose: kelvinProse ?? '',
  facts: kelvinFacts ?? '',
} as const
