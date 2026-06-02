// lib/sections/mobile.ts
import type { Section } from '../types'

export const mobile: Section = {
  id: 'mobile',
  label: 'Mobile',
  eyebrow: '',
  headline: "Don't just redesign.\nFix the foundation.",
  overviewBody: `Principal product design for Sensi mobile — modernizing the core app, shipping feature surfaces that earn trust, and greenfield tools for installers. Two stories below cover Sensi (platform, install, Spotlight) and WR Connect.`,
  lessonTitle: 'Lessons',
  lessonBody: `Platform work at scale is less about a single heroic launch than about a strategy that compounds — screen-by-screen migration, surgical fixes that unlock multiple outcomes, and surfaces that earn trust by behaving like the product, not an ad.`,
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
