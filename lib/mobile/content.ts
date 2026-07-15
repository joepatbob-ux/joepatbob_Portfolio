/** Structured copy for the Mobile case study (Sensi · WR Connect). */

import { requireContentRaw } from '@/lib/content/contentModules'
import { parseMarkdownFile } from '@/lib/content/parseMarkdown'

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
  imageSrc?: string
}

const SENSI_FOLDER = 'mobile/sensi'
const sensiIntro = parseMarkdownFile<SensiIntroMeta>(
  requireContentRaw(`${SENSI_FOLDER}/intro`),
)

export const MOBILE_SENSI = {
  headline: sensiIntro.meta.headline,
  intro: sensiIntro.body,
} as const

const wrConnect = parseMarkdownFile<WrConnectMeta>(
  requireContentRaw('mobile/wr-connect'),
)

export const MOBILE_WR_CONNECT = {
  headline: wrConnect.meta.headline,
  body: wrConnect.body,
  imageAlt: wrConnect.meta.imageAlt,
  imageSrc: wrConnect.meta.imageSrc ?? '/images/board.webp',
} as const
