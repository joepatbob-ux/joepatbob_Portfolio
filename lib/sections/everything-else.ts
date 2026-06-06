// lib/sections/everything-else.ts
import type { Section } from '../types'

export const everythingElse: Section = {
  id: 'everything-else',
  label: 'Everything In Between',
  eyebrow: '',
  headline: 'Everything In Between',
  overviewBody: '',
  lessonTitle: '',
  lessonBody: '',
  chapters: [
    {
      id: 'concepts',
      title: 'Concepts',
      subtitle: '',
      body: '',
      imageAlt: '',
      imageLayout: 'full-width',
      imagePosition: 'left',
    },
    {
      id: 'formation',
      title: 'Formation',
      subtitle: '',
      body: '',
      imageAlt: '',
      imageLayout: 'full-width',
      imagePosition: 'left',
    },
    {
      id: 'practice',
      title: 'Practice',
      subtitle: '',
      body: '',
      imageAlt: '',
      imageLayout: 'full-width',
      imagePosition: 'left',
    },
  ],
  closingQuote: {
    quote: 'Our job is to do the hard work\nso users don\'t have to.',
    attribution: 'Joseph Patrick Roberts',
  },
}
