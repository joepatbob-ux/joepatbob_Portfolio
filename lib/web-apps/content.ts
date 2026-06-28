/** Structured copy for Web Apps — single Kelvin DS chapter. */

import { requireContentRaw } from '@/lib/content/contentModules'
import { parseMarkdownFile, splitBodySections } from '@/lib/content/parseMarkdown'

type KelvinIntroMeta = {
  chapterId: string
  headline: string
  subhead: string
}

function loadProductsStory(raw: string) {
  const { meta, body } = parseMarkdownFile<{
    number: string
    heading: string
    products: readonly { name: string; domain: string; description: string }[]
  }>(raw)

  return {
    number: meta.number,
    heading: meta.heading,
    intro: '',
    products: meta.products,
    inertia: body,
  }
}

function loadStakesStory(raw: string) {
  const { meta, body } = parseMarkdownFile<{ number: string; heading: string }>(raw)
  const [intro, complianceCallout, close] = splitBodySections(body)

  return {
    number: meta.number,
    heading: meta.heading,
    intro,
    complianceCallout,
    close,
  }
}

function loadSystemStory(raw: string) {
  const { meta, body } = parseMarkdownFile<{
    number: string
    heading: string
    pillars: readonly { num: string; label: string; text: string }[]
  }>(raw)

  return {
    number: meta.number,
    heading: meta.heading,
    intro: body,
    pillars: meta.pillars,
  }
}

function loadRolloutStory(raw: string) {
  const { meta, body } = parseMarkdownFile<{
    number: string
    heading: string
    ndaNote: string
    thesisClose?: string
  }>(raw)

  return {
    number: meta.number,
    heading: meta.heading,
    ndaNote: meta.ndaNote,
    body,
    thesisClose: meta.thesisClose ?? '',
  }
}

const KELVIN_FOLDER = 'web-apps/kelvin-ds'
const kelvinIntro = parseMarkdownFile<KelvinIntroMeta>(
  requireContentRaw(`${KELVIN_FOLDER}/intro`),
)

export const WEB_APPS_KELVIN_CHAPTER_ID = kelvinIntro.meta.chapterId

export const WEB_APPS_KELVIN = {
  headline: kelvinIntro.meta.headline,
  subhead: kelvinIntro.meta.subhead,
  subStories: [
    loadProductsStory(requireContentRaw(`${KELVIN_FOLDER}/01-products`)),
    loadStakesStory(requireContentRaw(`${KELVIN_FOLDER}/02-stakes`)),
    loadSystemStory(requireContentRaw(`${KELVIN_FOLDER}/03-system`)),
    loadRolloutStory(requireContentRaw(`${KELVIN_FOLDER}/04-rollout`)),
  ],
} as const
