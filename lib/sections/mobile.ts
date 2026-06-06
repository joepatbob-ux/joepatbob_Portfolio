// lib/sections/mobile.ts
import type { Section } from '../types'

export const mobile: Section = {
  id: 'mobile',
  label: 'Mobile',
  eyebrow: '',
  headline: 'One app. Every Sensi thermostat since 2014.',
  overviewBody: `That's not a tagline — it's the constraint every decision in this section has to answer to. New patterns, new platforms, new features: all of it has to work across a hardware surface area that spans more than a decade. You can't migrate carelessly when a 2014 device is still connecting. You can't redesign the install flow without accounting for hardware that predates half the interaction patterns you're borrowing from. You can't add a content surface without protecting the trust of users who've depended on the app for years.

Most teams in this position make one of two calls: sunset the old hardware and frustrate loyal customers, or build a separate app and fragment the experience. The Sensi app did neither. It kept getting better without leaving anyone behind.

That's the through-line here. Not a single redesign moment, but a set of decisions — some visible, most not — that kept quality compounding on a product people already depended on.`,
  overviewMeta: [
    { label: 'Role', value: 'Principal Product Designer' },
    { label: 'Platform', value: 'iOS + Android' },
    { label: 'Timeline', value: '2018 – Present' },
    {
      label: 'Outcome',
      value:
        '#1 rated smart thermostat app · 4.3 → 4.7 iOS · 4.4 Android · ratings held through migration',
      wide: true,
    },
  ],
  lessonTitle: '',
  lessonBody: '',
  chapters: [
    {
      id: 'sensi',
      title: 'Sensi',
      subtitle: '',
      body: '',
      imageAlt: '',
      imageLayout: 'full-width',
      imagePosition: 'left',
    },
    {
      id: 'wr-connect',
      title: 'WR Connect',
      subtitle: '',
      body: '',
      imageAlt: '',
      imageLayout: 'full-width',
      imagePosition: 'left',
    },
  ],
}
