/** Structured copy for Everything In Between (Concepts · Formation · Practice). */

import eibSource from '@/content/everything-in-between.md?raw'
import { parseUxBeliefs } from '@/lib/everything-in-between/parseUxBeliefs'
import { everythingElse } from '@/lib/sections/everything-else'

function extractBowlQuotes(markdown: string): string {
  const match = markdown.match(/### Bowl quotes\s*\n([\s\S]*?)(?=^## |\z)/m)
  return match?.[1]?.trim() ?? ''
}

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

/** UX belief slips — edit `content/everything-in-between.md` → Bowl quotes. */
export const EIB_CONCEPT_QUOTES = parseUxBeliefs(extractBowlQuotes(eibSource))

export const EIB_CONCEPTS = {
  headline: 'Concepts',
  intro: `These principles didn't come from a workshop. They came from shipping things that couldn't be patched once they left the building, from watching users encounter interfaces that assumed too much, and from working inside organizations where the loudest voice in the room was rarely the user's.

The interface has to do the hard work. Not because it's a principle I hold — because I've watched what happens when it doesn't.`,
  answers: EIB_CONCEPT_QUOTES,
} as const

export const EIB_FORMATION = {
  headline: 'Formation',
  intro: `I came up through brand design. Identity, packaging, print — work where the canvas is fixed and every decision has to earn its place. That instinct didn't leave when I moved into product. It just found new constraints to work inside: hardware, firmware, regulatory requirements, OEM relationships. Each one sharpened something the last one couldn't.`,
  patents: [
    {
      number: 'US 12,608,066',
      title: 'Low Power Detection',
      status: 'Awarded · 2026',
    },
    {
      number: 'Patent pending',
      title: 'Segment display character set',
      status: '',
    },
  ],
} as const

export const EIB_PRACTICE = {
  headline: 'Practice',
  intro: `I built a portable demo kit because the sales team needed to show the product somewhere without a power outlet. I ran two rounds of corporate headshot sessions — coordinating dozens of colleagues across multiple days each — because consistent photos matter for the people in them and for how a company presents itself. I organized a crawfish boil because fed engineers show up differently than hungry ones.

None of this has a UX rationale. All of it comes from the same place the work does.`,
  close: `Direct, collaborative, not precious.`,
} as const
