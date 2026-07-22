import type { ContentDebugField, ContentDebugPage } from '@/lib/content/contentDebug'
import { EIB_FORMATION, EIB_PRACTICE } from '@/lib/everything-in-between/content'
import { MOBILE_SENSI, MOBILE_WR_CONNECT } from '@/lib/mobile/content'
import { hardware } from '@/lib/sections/hardware'
import { mobile } from '@/lib/sections/mobile'
import { everythingElse } from '@/lib/sections/everything-else'
import { webApps } from '@/lib/sections/webapps'
import { WEB_APPS_KELVIN } from '@/lib/web-apps/content'
import type { Section } from '@/lib/types'

const CONTENT_DIR: Record<string, string> = {
  hardware: 'hardware',
  mobile: 'mobile',
  'web-apps': 'web-apps',
  'everything-else': 'everything-in-between',
}

function field(
  key: string,
  label: string,
  fileHint: string,
  multiline = true,
): ContentDebugField {
  return { key, label, fileHint, multiline }
}

function overviewPage(section: Section): ContentDebugPage {
  const dir = CONTENT_DIR[section.id] ?? section.id
  const id = `${section.id}-overview`
  return {
    id,
    label: `${section.label} — Overview`,
    chapterId: `${section.id}-overview`,
    fields: [
      field(
        `${section.id}/section#headline`,
        'Headline',
        `content/${dir}/section.md → headline`,
        false,
      ),
      field(
        `${section.id}/overview#body`,
        'Body',
        `content/${dir}/overview.md`,
        true,
      ),
    ],
  }
}

function hardwareChapterPage(chapterId: string, title: string): ContentDebugPage {
  const id = `hardware-${chapterId}`
  return {
    id,
    label: `Hardware — ${title}`,
    chapterId: `hardware-${chapterId}`,
    fields: [
      field(
        `hardware/${chapterId}#title`,
        'Nav title',
        `content/hardware/${chapterId}.md → title`,
        false,
      ),
      field(
        `hardware/${chapterId}#subtitle`,
        'Slide headline',
        `content/hardware/${chapterId}.md → subtitle`,
        false,
      ),
      field(
        `hardware/${chapterId}#body`,
        'Body',
        `content/hardware/${chapterId}.md`,
        true,
      ),
    ],
  }
}

/** All editable pages + default values keyed by field key. */
export function buildContentDebugCatalog(): {
  pages: ContentDebugPage[]
  defaults: Record<string, string>
} {
  const defaults: Record<string, string> = {}

  const set = (key: string, value: string) => {
    defaults[key] = value
  }

  const pages: ContentDebugPage[] = [
    {
      id: 'interlude',
      label: 'Breather (interlude)',
      fields: [
        field(
          'interlude#headline',
          'Headline',
          'components/PortfolioInterlude.tsx',
          true,
        ),
        field('interlude#body', 'Body', 'components/PortfolioInterlude.tsx', true),
      ],
    },
    overviewPage(hardware),
    hardwareChapterPage('touch-2', 'Touch 2'),
    hardwareChapterPage('eim', 'EIM'),
    hardwareChapterPage('sensi-lite', 'Sensi Lite'),
    hardwareChapterPage('verdant', 'Verdant'),
    overviewPage(mobile),
    {
      id: 'mobile-sensi',
      label: 'Mobile — Sensi',
      chapterId: 'mobile-sensi',
      fields: [
        field(
          'mobile/sensi/intro#headline',
          'Headline',
          'content/mobile/sensi/intro.md → headline',
          false,
        ),
        field('mobile/sensi/intro#body', 'Body', 'content/mobile/sensi/intro.md', true),
      ],
    },
    {
      id: 'mobile-wr-connect',
      label: 'Mobile — WR Connect',
      chapterId: 'mobile-wr-connect',
      fields: [
        field(
          'mobile/wr-connect#headline',
          'Headline',
          'content/mobile/wr-connect.md → headline',
          false,
        ),
        field('mobile/wr-connect#body', 'Body', 'content/mobile/wr-connect.md', true),
      ],
    },
    overviewPage(webApps),
    {
      id: 'web-apps-kelvin-ds',
      label: 'Web Apps — Kelvin DS',
      chapterId: 'web-apps-kelvin-ds',
      fields: [
        field(
          'web-apps/kelvin-ds/intro#headline',
          'Headline',
          'content/web-apps/kelvin-ds/intro.md → headline',
          false,
        ),
        field(
          'web-apps/kelvin-ds/intro#subhead',
          'Subhead',
          'content/web-apps/kelvin-ds/intro.md → subhead',
          false,
        ),
        field(
          'web-apps/kelvin-ds/intro#ndaNote',
          'NDA note',
          'content/web-apps/kelvin-ds/intro.md → ndaNote',
          true,
        ),
        field(
          'web-apps/kelvin-ds/intro#prose',
          'Prose (above rule)',
          'content/web-apps/kelvin-ds/intro.md (before ---)',
          true,
        ),
        field(
          'web-apps/kelvin-ds/intro#facts',
          'Facts (below rule)',
          'content/web-apps/kelvin-ds/intro.md (after ---)',
          true,
        ),
      ],
    },
    overviewPage(everythingElse),
    {
      id: 'everything-else-formation',
      label: 'Everything Else — Formation',
      chapterId: 'everything-else-formation',
      fields: [
        field(
          'everything-in-between/formation/chapter#headline',
          'Headline',
          'content/everything-in-between/formation/chapter.md → headline',
          false,
        ),
        field(
          'everything-in-between/formation/chapter#body',
          'Body',
          'content/everything-in-between/formation/chapter.md',
          true,
        ),
      ],
    },
    {
      id: 'everything-else-practice',
      label: 'Everything Else — Practice',
      chapterId: 'everything-else-practice',
      fields: [
        field(
          'everything-in-between/practice/chapter#headline',
          'Headline',
          'content/everything-in-between/practice/chapter.md → headline',
          false,
        ),
        field(
          'everything-in-between/practice/chapter#body',
          'Body',
          'content/everything-in-between/practice/chapter.md',
          true,
        ),
        field(
          'everything-in-between/practice/chapter#close',
          'Close line',
          'content/everything-in-between/practice/chapter.md → close',
          true,
        ),
      ],
    },
  ]

  set(
    'interlude#headline',
    'The experience is bigger than any one product or team.',
  )
  set(
    'interlude#body',
    'Hardware, software, brand, sales, support, and the people behind them all shape what reaches the user. I look for the patterns that connect them, so each decision can solve the immediate problem while strengthening the larger experience.',
  )

  for (const section of [hardware, mobile, webApps, everythingElse]) {
    set(`${section.id}/section#headline`, section.headline)
    set(`${section.id}/overview#body`, section.overviewBody)
  }

  for (const ch of hardware.chapters) {
    set(`hardware/${ch.id}#title`, ch.title)
    set(`hardware/${ch.id}#subtitle`, ch.subtitle)
    set(`hardware/${ch.id}#body`, ch.body)
  }

  set('mobile/sensi/intro#headline', MOBILE_SENSI.headline)
  set('mobile/sensi/intro#body', MOBILE_SENSI.intro)
  set('mobile/wr-connect#headline', MOBILE_WR_CONNECT.headline)
  set('mobile/wr-connect#body', MOBILE_WR_CONNECT.body)

  set('web-apps/kelvin-ds/intro#headline', WEB_APPS_KELVIN.headline)
  set('web-apps/kelvin-ds/intro#subhead', WEB_APPS_KELVIN.subhead)
  set('web-apps/kelvin-ds/intro#ndaNote', WEB_APPS_KELVIN.ndaNote)
  set('web-apps/kelvin-ds/intro#prose', WEB_APPS_KELVIN.prose)
  set('web-apps/kelvin-ds/intro#facts', WEB_APPS_KELVIN.facts)

  set('everything-in-between/formation/chapter#headline', EIB_FORMATION.headline)
  set('everything-in-between/formation/chapter#body', EIB_FORMATION.intro)
  set('everything-in-between/practice/chapter#headline', EIB_PRACTICE.headline)
  set('everything-in-between/practice/chapter#body', EIB_PRACTICE.intro)
  set('everything-in-between/practice/chapter#close', EIB_PRACTICE.close)

  return { pages, defaults }
}

export const CONTENT_DEBUG_CATALOG = buildContentDebugCatalog()
