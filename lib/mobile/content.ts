/** Structured copy for the Mobile case study (Sensi · WR Connect). */

import sensiIntroRaw from '@/content/mobile/sensi-intro.md?raw'
import sensiColorModeRaw from '@/content/mobile/sensi-color-mode.md?raw'
import sensiInstallFlowRaw from '@/content/mobile/sensi-install-flow.md?raw'
import sensiSpotlightRaw from '@/content/mobile/sensi-spotlight.md?raw'
import wrConnectRaw from '@/content/mobile/wr-connect.md?raw'
import { parseMarkdownFile, splitBodySections } from '@/lib/content/parseMarkdown'

export const MOBILE_SECTION_TABS = [
  { id: 'sensi', label: 'Sensi' },
  { id: 'wr-connect', label: 'WR Connect' },
] as const

export type MobileSectionId = (typeof MOBILE_SECTION_TABS)[number]['id']

export function mobileChapterId(sectionId: MobileSectionId): string {
  return `mobile-${sectionId}`
}

type SensiIntroMeta = { headline: string }

type WrConnectMeta = {
  headline: string
  imageAlt: string
}

function loadColorModeStory(raw: string) {
  const { meta, body } = parseMarkdownFile<{
    heading: string
    problems: readonly { label: string; text: string }[]
    scrubber: {
      beforeSrc: string
      afterSrc: string
      beforeAlt: string
      afterAlt: string
      caption: string
    }
  }>(raw)

  return {
    heading: meta.heading,
    body,
    problems: meta.problems,
    scrubber: meta.scrubber,
  }
}

function loadInstallFlowStory(raw: string) {
  const { meta, body } = parseMarkdownFile<{ heading: string }>(raw)
  return { heading: meta.heading, body }
}

function loadSpotlightStory(raw: string) {
  const { meta, body } = parseMarkdownFile<{
    heading: string
    decisions: readonly { label: string; text: string }[]
    testingHeading: string
  }>(raw)
  const [intro, testingBody, closeBody] = splitBodySections(body)

  return {
    heading: meta.heading,
    intro,
    decisions: meta.decisions,
    testingHeading: meta.testingHeading,
    testingBody,
    closeBody,
  }
}

const sensiIntro = parseMarkdownFile<SensiIntroMeta>(sensiIntroRaw)

export const MOBILE_SENSI = {
  headline: sensiIntro.meta.headline,
  intro: sensiIntro.body,
  subStories: [
    loadColorModeStory(sensiColorModeRaw),
    loadInstallFlowStory(sensiInstallFlowRaw),
    loadSpotlightStory(sensiSpotlightRaw),
  ],
} as const

const wrConnect = parseMarkdownFile<WrConnectMeta>(wrConnectRaw)

export const MOBILE_WR_CONNECT = {
  headline: wrConnect.meta.headline,
  body: wrConnect.body,
  imageAlt: wrConnect.meta.imageAlt,
} as const
