/**
 * Stamp dist/sitemap.xml's <lastmod> with the build date. The source file in
 * assets/ keeps a placeholder value; hand-maintaining it just means it goes
 * stale (it was a month behind when this script was added).
 */
import { readFileSync, writeFileSync } from 'node:fs'

const path = new URL('../dist/sitemap.xml', import.meta.url)
const today = new Date().toISOString().slice(0, 10)
const xml = readFileSync(path, 'utf8')
const stamped = xml.replace(/<lastmod>[^<]*<\/lastmod>/g, `<lastmod>${today}</lastmod>`)

if (stamped === xml && !xml.includes(`<lastmod>${today}</lastmod>`)) {
  console.error('stamp-sitemap: FAIL — no <lastmod> element found in dist/sitemap.xml')
  process.exit(1)
}

writeFileSync(path, stamped)
console.log(`stamp-sitemap: OK — <lastmod> set to ${today}`)
