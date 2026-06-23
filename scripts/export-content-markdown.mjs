#!/usr/bin/env node
/**
 * One-shot helper: read editorial strings from lib/sections and lib content modules,
 * and write content markdown files. Run after editing TS sources, before switching loaders.
 *
 *   node scripts/export-content-markdown.mjs
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')

function extractTemplateField(source, constName, field) {
  const block = source.match(new RegExp(`export const ${constName} = \\{([\\s\\S]*?)\\} as const`))?.[1]
  if (!block) throw new Error(`Could not find export const ${constName}`)
  const fieldMatch = block.match(new RegExp(`${field}: \`([\\s\\S]*?)\`,`))
  if (!fieldMatch) throw new Error(`Could not find ${constName}.${field}`)
  return fieldMatch[1]
}

function extractQuotedField(source, constName, field) {
  const block = source.match(new RegExp(`export const ${constName} = \\{([\\s\\S]*?)\\} as const`))?.[1]
  if (!block) throw new Error(`Could not find export const ${constName}`)
  const fieldMatch = block.match(new RegExp(`${field}: '([^']*)'`))
  if (!fieldMatch) throw new Error(`Could not find ${constName}.${field}`)
  return fieldMatch[1]
}

function extractPatents(source) {
  const block = source.match(/export const EIB_FORMATION = \{([\s\S]*?)\} as const/)?.[1]
  const patentsBlock = block?.match(/patents: (\[[\s\S]*?\]),/)?.[1]
  if (!patentsBlock) throw new Error('EIB_FORMATION.patents not found')
  return Function(`"use strict"; return (${patentsBlock})`)()
}

function extractExportConst(source, name) {
  const re = new RegExp(`export const ${name} = ([\\s\\S]*?) as const`, 'm')
  const match = source.match(re)
  if (!match) throw new Error(`Could not find export const ${name}`)
  return Function(`"use strict"; return (${match[1]})`)()
}

function writeMd(file, meta, body) {
  const dir = path.dirname(file)
  fs.mkdirSync(dir, { recursive: true })
  const front = `---\n${JSON.stringify(meta, null, 2)}\n---\n\n${body.trim()}\n`
  fs.writeFileSync(file, front, 'utf8')
}

function exportHardware() {
  const src = fs.readFileSync(path.join(root, 'lib/sections/hardware.ts'), 'utf8')
  const re = /export const hardware: Section = (\{[\s\S]*\})\n/
  const match = src.match(re)
  if (!match) throw new Error('hardware section not found')
  // eslint-disable-next-line no-new-func
  const section = Function(`"use strict"; return (${match[1]})`)()

  writeMd(
    path.join(root, 'content/hardware/section.md'),
    {
      id: section.id,
      label: section.label,
      eyebrow: section.eyebrow,
      headline: section.headline,
      overviewMeta: section.overviewMeta,
      lessonTitle: section.lessonTitle,
      lessonBody: section.lessonBody,
      chapterOrder: section.chapters.map((c) => c.id),
    },
    section.overviewBody,
  )

  for (const chapter of section.chapters) {
    const { id, title, subtitle, body, imageAlt, imageSrc, imageLayout, imagePosition } = chapter
    writeMd(
      path.join(root, `content/hardware/${id}.md`),
      {
        id,
        title,
        subtitle,
        imageAlt,
        ...(imageSrc ? { imageSrc } : {}),
        imageLayout,
        imagePosition,
      },
      body,
    )
  }
}

function exportSectionStub(file, outDir) {
  const src = fs.readFileSync(path.join(root, file), 'utf8')
  const name = path.basename(file, '.ts')
  const exportName =
    name === 'webapps' ? 'webApps' : name === 'everything-else' ? 'everythingElse' : name
  const re = new RegExp(`export const ${exportName}: Section = (\\{[\\s\\S]*\\})\\n`)
  const match = src.match(re)
  if (!match) throw new Error(`${exportName} section not found`)
  const section = Function(`"use strict"; return (${match[1]})`)()

  writeMd(
    path.join(root, `content/${outDir}/section.md`),
    {
      id: section.id,
      label: section.label,
      eyebrow: section.eyebrow,
      headline: section.headline,
      overviewMeta: section.overviewMeta,
      lessonTitle: section.lessonTitle,
      lessonBody: section.lessonBody,
      chapterOrder: section.chapters.map((c) => c.id),
    },
    section.overviewBody,
  )

  for (const chapter of section.chapters) {
    const { id, title, subtitle, body, imageAlt, imageSrc, imageLayout, imagePosition } = chapter
    writeMd(
      path.join(root, `content/${outDir}/${id}.md`),
      {
        id,
        title,
        subtitle,
        imageAlt,
        ...(imageSrc ? { imageSrc } : {}),
        imageLayout,
        imagePosition,
      },
      body,
    )
  }
}

function exportMobile() {
  const src = fs.readFileSync(path.join(root, 'lib/mobile/content.ts'), 'utf8')
  const sensi = extractExportConst(src, 'MOBILE_SENSI')
  const wr = extractExportConst(src, 'MOBILE_WR_CONNECT')

  writeMd(
    path.join(root, 'content/mobile/sensi-intro.md'),
    { headline: sensi.headline },
    sensi.intro,
  )

  const subFiles = ['color-mode', 'install-flow', 'spotlight']
  sensi.subStories.forEach((story, i) => {
    const { heading, body, intro, problems, scrubber, decisions, testingHeading, testingBody, closeBody } =
      story
    const meta = { heading }
    if (problems) meta.problems = problems
    if (scrubber) meta.scrubber = scrubber
    if (decisions) meta.decisions = decisions
    if (testingHeading) meta.testingHeading = testingHeading

    let prose = body ?? intro ?? ''
    const extra = []
    if (testingBody) extra.push(testingBody)
    if (closeBody) extra.push(closeBody)
    if (extra.length) prose = [prose, ...extra].join('\n\n---\n\n')

    writeMd(path.join(root, `content/mobile/sensi-${subFiles[i]}.md`), meta, prose)
  })

  writeMd(
    path.join(root, 'content/mobile/wr-connect.md'),
    { headline: wr.headline, imageAlt: wr.imageAlt },
    wr.body,
  )
}

function exportWebApps() {
  const src = fs.readFileSync(path.join(root, 'lib/web-apps/content.ts'), 'utf8')
  const kelvin = extractExportConst(src, 'WEB_APPS_KELVIN')
  const chapterId = src.match(/WEB_APPS_KELVIN_CHAPTER_ID = '([^']+)'/)?.[1]

  writeMd(
    path.join(root, 'content/web-apps/kelvin-intro.md'),
    {
      chapterId,
      headline: kelvin.headline,
      subhead: kelvin.subhead,
    },
    '',
  )

  const files = ['01-products', '02-stakes', '03-system', '04-rollout']
  kelvin.subStories.forEach((story, i) => {
    const {
      number,
      heading,
      intro,
      products,
      inertia,
      complianceCallout,
      close,
      pillars,
      ndaNote,
      body,
      thesisClose,
    } = story
    const meta = { number, heading }
    if (products) meta.products = products
    if (pillars) meta.pillars = pillars
    if (ndaNote) meta.ndaNote = ndaNote
    if (thesisClose) meta.thesisClose = thesisClose

    const parts = []
    if (intro?.trim()) parts.push(intro.trim())
    if (inertia?.trim()) parts.push(inertia.trim())
    if (complianceCallout?.trim()) parts.push(complianceCallout.trim())
    if (close?.trim()) parts.push(close.trim())
    if (body?.trim()) parts.push(body.trim())

    writeMd(path.join(root, `content/web-apps/kelvin-${files[i]}.md`), meta, parts.join('\n\n---\n\n'))
  })
}

function exportEib() {
  const src = fs.readFileSync(path.join(root, 'lib/everything-in-between/content.ts'), 'utf8')
  const sectionSrc = fs.readFileSync(path.join(root, 'lib/sections/everything-else.ts'), 'utf8')
  const section = Function(
    `"use strict"; return (${sectionSrc.match(/export const everythingElse: Section = (\{[\s\S]*\})\n/)[1]})`,
  )()

  writeMd(
    path.join(root, 'content/everything-in-between/section.md'),
    {
      id: section.id,
      label: section.label,
      eyebrow: section.eyebrow,
      headline: section.headline,
      overviewMeta: section.overviewMeta,
      lessonTitle: section.lessonTitle,
      lessonBody: section.lessonBody,
      chapterOrder: section.chapters.map((c) => c.id),
    },
    section.overviewBody,
  )

  writeMd(
    path.join(root, 'content/everything-in-between/concepts.md'),
    {
      id: 'concepts',
      title: 'Concepts',
      headline: extractQuotedField(src, 'EIB_CONCEPTS', 'headline'),
      imageAlt: section.chapters[0].imageAlt,
    },
    extractTemplateField(src, 'EIB_CONCEPTS', 'intro'),
  )

  writeMd(
    path.join(root, 'content/everything-in-between/formation.md'),
    {
      id: 'formation',
      title: 'Formation',
      headline: extractQuotedField(src, 'EIB_FORMATION', 'headline'),
      imageAlt: section.chapters[1].imageAlt,
      patents: extractPatents(src),
    },
    extractTemplateField(src, 'EIB_FORMATION', 'intro'),
  )

  writeMd(
    path.join(root, 'content/everything-in-between/practice.md'),
    {
      id: 'practice',
      title: 'Practice',
      headline: extractQuotedField(src, 'EIB_PRACTICE', 'headline'),
      imageAlt: section.chapters[2].imageAlt,
      close: extractTemplateField(src, 'EIB_PRACTICE', 'close'),
    },
    extractTemplateField(src, 'EIB_PRACTICE', 'intro'),
  )
}

exportHardware()
exportSectionStub('lib/sections/mobile.ts', 'mobile')
exportSectionStub('lib/sections/webapps.ts', 'web-apps')
exportMobile()
exportWebApps()
exportEib()

console.log('Exported content/**/*.md')
