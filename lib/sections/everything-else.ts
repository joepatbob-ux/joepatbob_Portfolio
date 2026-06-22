// lib/sections/everything-else.ts
import type { Section } from '../types'

export const everythingElse: Section = {
  id: 'everything-else',
  label: 'Everything In Between',
  eyebrow: '',
  headline: "Good design work doesn't come from talent applied domain by domain.",
  overviewBody: `It comes from a way of working that travels — across hardware, software, and constraints it's never seen before.

The work shows where that produced something. This chapter is about the methodology underneath — how it formed, what it holds, and where it shows up when there's no finished product to point to.`,
  overviewMeta: [
    { label: 'Role', value: 'Principal Product Designer' },
    { label: 'Sections', value: 'Concepts · Formation · Practice' },
    {
      label: 'Scope',
      value: 'UX principles · Design formation · Organizational craft',
      wide: true,
    },
    {
      label: 'Patents',
      value: 'US 12,608,066 · Segment display character set (pending)',
      wide: true,
    },
  ],
  lessonTitle: '',
  lessonBody: '',
  chapters: [
    {
      id: 'concepts',
      title: 'Concepts',
      subtitle: '',
      body: '',
      imageAlt: 'Concept quote bowl — UX principle answers',
      imageLayout: 'full-width',
      imagePosition: 'left',
    },
    {
      id: 'formation',
      title: 'Formation',
      subtitle: '',
      body: '',
      imageAlt: 'Formation LEGO board — patent claim visualization',
      imageLayout: 'full-width',
      imagePosition: 'left',
    },
    {
      id: 'practice',
      title: 'Practice',
      subtitle: '',
      body: '',
      imageAlt: 'Launch sticker pile — drag stickers onto the page',
      imageLayout: 'full-width',
      imagePosition: 'left',
    },
  ],
}
