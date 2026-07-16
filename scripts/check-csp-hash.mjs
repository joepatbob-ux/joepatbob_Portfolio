/**
 * The CSP in vercel.json allows the theme-boot inline script by sha256 hash.
 * If anyone edits that script without updating the hash, every visitor gets a
 * flash of the wrong theme (the script is silently refused). Fail the build
 * on drift instead.
 */
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'

const html = readFileSync(new URL('../dist/index.html', import.meta.url), 'utf8')
const vercel = readFileSync(new URL('../vercel.json', import.meta.url), 'utf8')

const inline = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map((m) => m[1])
const allowed = [...vercel.matchAll(/'sha256-([A-Za-z0-9+/=]+)'/g)].map((m) => m[1])

const missing = []
for (const body of inline) {
  const hash = createHash('sha256').update(body).digest('base64')
  if (!allowed.includes(hash)) missing.push(hash)
}

if (missing.length > 0) {
  console.error(
    `check-csp-hash: FAIL — dist/index.html has ${missing.length} inline script(s) ` +
      `whose hash is not in vercel.json's Content-Security-Policy:\n` +
      missing.map((h) => `  'sha256-${h}'`).join('\n') +
      `\nUpdate the script-src hash in vercel.json to match.`,
  )
  process.exit(1)
}

console.log(
  `check-csp-hash: OK — ${inline.length} inline script(s) covered by the CSP hash allowlist`,
)
