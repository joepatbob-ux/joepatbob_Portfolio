/**
 * Behavioral drive suite: boots the built site (dist/ + vercel.json headers)
 * in headless Chromium and drives it the way a visitor would, asserting the
 * scroll choreography that unit tests can't see. Requires a prerendered
 * build — run `npm run build` first. See docs/scroll-choreography.md.
 *
 *   npm run check:drive            # all drives
 *   npm run check:drive -- nav csp # a subset
 */
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { launchDriveBrowser, serveDist, root } from './harness.mjs'
import * as hydration from './hydration.mjs'
import * as choreography from './choreography.mjs'
import * as stickers from './stickers.mjs'
import * as nav from './nav.mjs'
import * as csp from './csp.mjs'
import * as eim from './eim.mjs'

const DRIVES = { hydration, choreography, stickers, nav, csp, eim }
const PORT = 3014

function assertPrerenderedDist() {
  const index = join(root, 'dist', 'index.html')
  if (!existsSync(index)) {
    throw new Error('dist/index.html missing — run `npm run build` first')
  }
  const html = readFileSync(index, 'utf8')
  // The prerender step bakes the app markup into #root; a plain vite build
  // leaves it empty and every drive would fail confusingly.
  if (!/<div id="root">\s*<\S/.test(html)) {
    throw new Error(
      'dist/index.html is not prerendered (empty #root) — run the full `npm run build`, not just `vite build`',
    )
  }
}

async function main() {
  const requested = process.argv.slice(2)
  const unknown = requested.filter((n) => !DRIVES[n])
  if (unknown.length > 0) {
    throw new Error(
      `unknown drive(s): ${unknown.join(', ')} (available: ${Object.keys(DRIVES).join(', ')})`,
    )
  }
  const names = requested.length > 0 ? requested : Object.keys(DRIVES)

  assertPrerenderedDist()
  const server = await serveDist(PORT)
  const browser = await launchDriveBrowser()

  let failures = 0
  try {
    for (const name of names) {
      failures += await DRIVES[name].run({ browser, baseUrl: server.url })
    }
  } finally {
    await browser.close()
    await server.close()
  }

  console.log(
    failures === 0
      ? `check:drive: all ${names.length} drive(s) passed`
      : `check:drive: ${failures} failure(s)`,
  )
  process.exit(failures === 0 ? 0 : 1)
}

main().catch((err) => {
  console.error(`check:drive: ${err.message}`)
  process.exit(1)
})
