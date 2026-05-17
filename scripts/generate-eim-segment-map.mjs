import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.join(__dirname, '..')
const SRC = path.join(ROOT, 'public/images/Devices/eimpath.svg')
const OUT_SVG = path.join(ROOT, 'public/images/Devices/eimpath-segment-numbers.svg')
const OUT_PNG = path.join(ROOT, 'public/images/Devices/eimpath-segment-numbers.png')

const PATH_FILL = '#F5431B'
const TOUCH2 = { x: 182, y: 132 }

/** Keep in sync with `EIM_DASH_REVEAL_ORDER` in lib/eimPathSegments.ts */
const REVEAL_ORDER = [
  36, 40, 47, 54, 58, 60, 61, 59, 57, 51, 44, 31, 25, 27, 32, 35, 41, 39, 33,
  24, 18, 13, 8, 4, 1, 2, 5, 9, 12, 16, 20, 26, 30, 38, 43, 45, 49, 52, 53,
  50, 48, 42, 34, 28, 22, 15, 11, 7, 3, 6, 10, 14, 17, 19, 21, 23, 29, 37,
  46, 56, 63, 64, 66, 69, 70, 68, 67, 65, 62, 55,
]

function splitPathSubpaths(d) {
  return d
    .split(/(?=M)/)
    .map((s) => s.trim())
    .filter(Boolean)
}

function subpathStart(subpath) {
  const m = subpath.match(/^M([-\d.]+)[,\s]+([-\d.]+)/)
  if (!m) return null
  return { x: Number.parseFloat(m[1]), y: Number.parseFloat(m[2]) }
}

function subpathDistanceFrom(subpath, origin) {
  const start = subpathStart(subpath)
  if (!start) return Infinity
  return Math.hypot(start.x - origin.x, start.y - origin.y)
}

function sortByLegacyId(segments) {
  return [...segments].sort(
    (a, b) => subpathDistanceFrom(a, TOUCH2) - subpathDistanceFrom(b, TOUCH2),
  )
}

function sortByRevealOrder(segments) {
  const byLegacyId = sortByLegacyId(segments)
  return REVEAL_ORDER.map((legacyId) => byLegacyId[legacyId - 1])
}

function escapeXml(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

const raw = fs.readFileSync(SRC, 'utf8')
const meanderMatch = raw.match(
  new RegExp(`<path\\s+d="([^"]+)"\\s+fill="${PATH_FILL}"\\s*/>`, 'i'),
)
if (!meanderMatch) {
  console.error('Orange meander path not found')
  process.exit(1)
}

const segments = sortByRevealOrder(splitPathSubpaths(meanderMatch[1]))
const baseSvg = raw.replace(meanderMatch[0], '')

const dashPaths = segments
  .map(
    (d) =>
      `<path d="${escapeXml(d)}" fill="${PATH_FILL}" fill-opacity="0.55"/>`,
  )
  .join('\n')

const labels = segments
  .map((d, i) => {
    const start = subpathStart(d) ?? TOUCH2
    const n = i + 1
    return `<g>
  <circle cx="${start.x}" cy="${start.y}" r="7" fill="#fff" stroke="#111" stroke-width="1"/>
  <text x="${start.x}" y="${start.y}" text-anchor="middle" dominant-baseline="central" font-family="ui-monospace, Menlo, monospace" font-size="7" font-weight="700" fill="#111">${n}</text>
</g>`
  })
  .join('\n')

const openTag = baseSvg.match(/<svg[^>]*>/)?.[0]
const closeIdx = baseSvg.lastIndexOf('</svg>')
if (!openTag || closeIdx === -1) {
  console.error('Invalid source SVG')
  process.exit(1)
}

const inner = baseSvg.slice(openTag.length, closeIdx)
const out = `${openTag}
${inner}
<g id="eim-dashes">${dashPaths}</g>
<g id="eim-segment-labels">${labels}</g>
<circle cx="${TOUCH2.x}" cy="${TOUCH2.y}" r="5" fill="#00aeef" stroke="#fff" stroke-width="1.5"/>
<text x="${TOUCH2.x + 9}" y="${TOUCH2.y + 3}" font-family="ui-monospace, Menlo, monospace" font-size="7" font-weight="700" fill="#00aeef">Touch 2 origin</text>
</svg>`

fs.writeFileSync(OUT_SVG, out)
console.log(`Wrote ${OUT_SVG} (${segments.length} segments, reveal order 1→70)`)
