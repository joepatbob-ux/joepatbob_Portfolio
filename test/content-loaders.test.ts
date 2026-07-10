import { describe, expect, it } from 'vitest'
import { everythingElse } from '@/lib/sections/everything-else'
import { hardware } from '@/lib/sections/hardware'
import { mobile } from '@/lib/sections/mobile'
import { webApps } from '@/lib/sections/webapps'
import { MOBILE_SENSI, MOBILE_WR_CONNECT } from '@/lib/mobile/content'
import { WEB_APPS_KELVIN } from '@/lib/web-apps/content'

// Importing the section modules runs loadSection() at module load, which parses
// every content/**/*.md file. A malformed frontmatter JSON or missing chapter
// file therefore fails these tests — the regression guard the content churn needs.
const sections = { hardware, mobile, webApps, everythingElse }

describe('section loaders parse all content into well-formed sections', () => {
  for (const [name, section] of Object.entries(sections)) {
    it(`${name}`, () => {
      expect(section.id.length).toBeGreaterThan(0)
      expect(typeof section.label).toBe('string')
      expect(typeof section.headline).toBe('string')
      expect(Array.isArray(section.chapters)).toBe(true)
      expect(section.chapters.length).toBeGreaterThan(0)
      for (const chapter of section.chapters) {
        expect(chapter.id.length).toBeGreaterThan(0)
      }
    })
  }
})

describe('per-chapter content invariants', () => {
  it('Sensi exposes a headline and intro copy', () => {
    expect(MOBILE_SENSI.headline).toBeTruthy()
    expect(MOBILE_SENSI.intro).toBeTruthy()
  })

  it('WR Connect exposes headline, body, and an /images/ imageSrc', () => {
    expect(MOBILE_WR_CONNECT.headline).toBeTruthy()
    expect(MOBILE_WR_CONNECT.body).toBeTruthy()
    expect(MOBILE_WR_CONNECT.imageSrc).toMatch(/^\/images\//)
  })

  it('Kelvin splits its intro into prose + facts and keeps the NDA note', () => {
    expect(WEB_APPS_KELVIN.headline).toBeTruthy()
    expect(WEB_APPS_KELVIN.prose).toBeTruthy()
    expect(WEB_APPS_KELVIN.ndaNote).toBeTruthy()
  })
})
