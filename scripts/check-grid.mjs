#!/usr/bin/env node
/**
 * check-grid — flags layout-system drift in the stylesheets.
 *
 * Rules (see styles/case-study-layout-tokens.css for the scales):
 *   1. Spacing (padding / margin / gap): px values must be multiples of 4
 *      (8pt grid, 4pt half-steps). Exempt: 1–3px strokes, 44px touch target.
 *   2. Type: no raw px font-size literals — use the --text-* ramp (or a
 *      clamp() for fluid display sizes, which stay per-stage art direction).
 *   3. Z-index: literals above 100 (the component-local band) must be --z-* tokens.
 *   4. Radius: px radii on the 4/8/12/16/24 scale (pills/circles exempt).
 *
 * Report-only by default (exit 0). Pass --strict to exit 1 when anything is
 * flagged (for a blocking gate). Positioning props (top/left/right/bottom/inset)
 * are intentionally skipped — they're usually layout offsets, not spacing.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'

const STYLES_DIR = 'styles'
const SPACING_PROP = /(^|[\s;{])(row-gap|column-gap|gap|padding(?:-(?:top|right|bottom|left|inline|block))?|margin(?:-(?:top|right|bottom|left|inline|block))?)\s*:\s*([^;}]+)/gi
const PX = /(\d+(?:\.\d+)?)px/g
const EXEMPT = new Set([0, 1, 2, 3, 44])

function cssFiles(dir) {
  const out = []
  for (const name of readdirSync(dir)) {
    const p = join(dir, name)
    if (statSync(p).isDirectory()) out.push(...cssFiles(p))
    else if (name.endsWith('.css')) out.push(p)
  }
  return out
}

function offGrid(value) {
  const n = Number(value)
  if (EXEMPT.has(n)) return false
  return n % 4 !== 0
}

// Rule 2: raw px font-size literals (17px cinema body bump is documented)
const FONT_SIZE = /(^|[\s;{])font-size\s*:\s*(\d+(?:\.\d+)?px)\s*(?:;|\})/gi
const FONT_SIZE_EXEMPT = new Set(['17px'])
// Rule 3: z-index literals above the component band must be tokens
const Z_INDEX = /(^|[\s;{])z-index\s*:\s*(-?\d+)\s*(?:!important\s*)?(?:;|\})/gi
const Z_LITERAL_MAX = 100 /* <=100 is the documented component-local band */
// Rule 4: px radii on the scale; big values are pills (with 50%/9999px)
const RADIUS = /(^|[\s;{])border-radius\s*:\s*([^;}]+)/gi
const RADIUS_OK = new Set([0, 1, 2, 3, 4, 8, 12, 16, 24])
const radiusOff = (n) => !RADIUS_OK.has(Number(n)) && Number(n) < 100

let total = 0
const byFile = new Map()
const flag = (file, line, prop, value, note) => {
  const list = byFile.get(file) ?? []
  list.push({ line, prop, value: value.trim(), note })
  byFile.set(file, list)
  total += 1
}

for (const file of cssFiles(STYLES_DIR)) {
  const text = readFileSync(file, 'utf8')
  const lineOf = (idx) => text.slice(0, idx).split('\n').length
  let m
  SPACING_PROP.lastIndex = 0
  while ((m = SPACING_PROP.exec(text)) !== null) {
    const bad = [...m[3].matchAll(PX)].map((x) => x[1]).filter(offGrid)
    if (bad.length === 0) continue
    flag(file, lineOf(m.index), m[2], m[3], `off-grid: ${[...new Set(bad)].join(', ')}px`)
  }
  FONT_SIZE.lastIndex = 0
  while ((m = FONT_SIZE.exec(text)) !== null) {
    if (FONT_SIZE_EXEMPT.has(m[2])) continue
    flag(file, lineOf(m.index), 'font-size', m[2], 'raw px — use the --text-* ramp')
  }
  Z_INDEX.lastIndex = 0
  while ((m = Z_INDEX.exec(text)) !== null) {
    if (Math.abs(Number(m[2])) <= Z_LITERAL_MAX) continue
    flag(file, lineOf(m.index), 'z-index', m[2], 'magic number — use a --z-* token')
  }
  RADIUS.lastIndex = 0
  while ((m = RADIUS.exec(text)) !== null) {
    const bad = [...m[2].matchAll(PX)].map((x) => x[1]).filter(radiusOff)
    if (bad.length === 0) continue
    flag(file, lineOf(m.index), 'border-radius', m[2], `off-scale: ${[...new Set(bad)].join(', ')}px`)
  }
}

if (total === 0) {
  console.log('check-grid: ✓ spacing, type, z-index, and radii all on the system scales')
  process.exit(0)
}

console.log(`check-grid: ${total} issue(s) found\n`)
for (const [file, list] of [...byFile.entries()].sort()) {
  console.log(file)
  for (const { line, prop, value, note } of list) {
    console.log(`  ${line}: ${prop}: ${value}  → ${note}`)
  }
  console.log('')
}
console.log(
  'Scales: spacing = 4px multiples (1–3px strokes, 44px targets exempt) · type = --text-* · z-index literals <= 100 · radii 4/8/12/16/24 (+pills).',
)

process.exit(process.argv.includes('--strict') ? 1 : 0)
