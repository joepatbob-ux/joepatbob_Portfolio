/** Structured copy for Web Apps — single Kelvin DS chapter. */

import kelvinIntroRaw from '@/content/web-apps/kelvin-intro.md?raw'
import kelvin01Raw from '@/content/web-apps/kelvin-01-products.md?raw'
import kelvin02Raw from '@/content/web-apps/kelvin-02-stakes.md?raw'
import kelvin03Raw from '@/content/web-apps/kelvin-03-system.md?raw'
import kelvin04Raw from '@/content/web-apps/kelvin-04-rollout.md?raw'
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

const kelvinIntro = parseMarkdownFile<KelvinIntroMeta>(kelvinIntroRaw)

export const WEB_APPS_KELVIN_CHAPTER_ID = kelvinIntro.meta.chapterId

export const WEB_APPS_KELVIN = {
  headline: kelvinIntro.meta.headline,
  subhead: kelvinIntro.meta.subhead,
  subStories: [
    loadProductsStory(kelvin01Raw),
    loadStakesStory(kelvin02Raw),
    loadSystemStory(kelvin03Raw),
    loadRolloutStory(kelvin04Raw),
  ],
} as const
