/** Structured copy for Everything In Between (Conviction · Formation · Practice). */

export const EIB_SECTION_TABS = [
  { id: 'conviction', label: 'Conviction' },
  { id: 'formation', label: 'Formation' },
  { id: 'practice', label: 'Practice' },
] as const

export type EibSectionId = (typeof EIB_SECTION_TABS)[number]['id']

export function eibChapterId(sectionId: EibSectionId): string {
  return `everything-else-${sectionId}`
}

export const EIB_CHAPTER_INTRO = `Good design work doesn't come from talent applied domain by domain. It comes from a way of working that travels — across hardware, software, constraints it's never seen before.

The work shows where that produced something. This chapter is about the methodology underneath it — how it formed, what it holds, and where it shows up when there's no finished product to point to.

Conviction. Formation. Practice.`

export const EIB_CONVICTION = {
  intro: `The principles didn't come from a workshop. They came from shipping things that couldn't be updated once they left the building, from watching users encounter interfaces that assumed too much, and from working inside organizations where the loudest voice in the room often wasn't the user.

I believe the interface has to do the hard work. Not because it's a principle I hold — because I've seen what happens when it doesn't.`,
  principles: [
    {
      num: '01',
      statement: "If it's worth buying, it sells itself.",
    },
    {
      num: '02',
      statement: 'Value flows from the user up, not the boardroom down.',
    },
    {
      num: '03',
      statement:
        "Our job is to do the hard work so users don't have to.",
    },
    {
      num: '04',
      statement:
        "It's okay to move the cheese, as long as you put it somewhere better.",
    },
  ],
} as const

export const EIB_FORMATION = {
  intro: `I came up through brand design. Identity, packaging, print — work where the canvas is fixed and every decision has to earn its place. That instinct never left when I moved into product. It just found new constraints to work inside. Hardware. Firmware. Regulatory requirements. OEM relationships. Each one sharpened something the last one couldn't.`,
  patents: [
    {
      number: 'US 12,608,066',
      title: 'Low Power Detection',
      status: 'Awarded · 2026',
    },
    {
      number: 'Segment display character set',
      title: '',
      status: 'Pending',
    },
  ],
} as const

export const EIB_PRACTICE = {
  intro: `I built a portable demo kit because the sales team needed to show the product somewhere without a power outlet. I ran corporate headshot sessions because consistent photos matter for the people in them. I organized a crawfish boil because fed engineers show up differently than hungry ones. None of this has a UX rationale. All of it comes from the same place the work does.`,
  close: `Direct, collaborative, not precious.`,
  email: 'me@joepatbob.com',
  linkedIn: 'linkedin.com/in/joepatbob',
} as const
