#!/usr/bin/env node
/**
 * check-grid — flags off-grid spacing values in the stylesheets.
 *
 * The design system is on an 8pt grid with 4pt half-steps (see the --space-*
 * scale in styles/case-study-layout-tokens.css). This scans spacing declarations
 * (padding / margin / gap) for px values that aren't multiples of 4.
 *
 * Deliberate exemptions (not reported):
 *   - 1–3px  → hairline strokes / borders / optical nudges (accent weights)
 *   - 44px   → WCAG minimum touch target
 *
 * Report-only by default (exit 0). Pass --strict to exit 1 when anything is
 * off-grid (for a blocking gate). Positioning props (top/left/right/bottom/inset)
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

let total = 0
const byFile = new Map()

for (const file of cssFiles(STYLES_DIR)) {
  const text = readFileSync(file, 'utf8')
  let m
  SPACING_PROP.lastIndex = 0
  while ((m = SPACING_PROP.exec(text)) !== null) {
    const value = m[3]
    const bad = [...value.matchAll(PX)].map((x) => x[1]).filter(offGrid)
    if (bad.length === 0) continue
    // line number of the match
    const line = text.slice(0, m.index).split('\n').length
    const list = byFile.get(file) ?? []
    list.push({ line, prop: m[2], value: value.trim(), bad: [...new Set(bad)] })
    byFile.set(file, list)
    total += bad.length
  }
}

if (total === 0) {
  console.log('check-grid: ✓ all spacing values on the 4/8pt grid')
  process.exit(0)
}

console.log(`check-grid: ${total} off-grid spacing value(s) found\n`)
for (const [file, list] of [...byFile.entries()].sort()) {
  console.log(file)
  for (const { line, prop, value, bad } of list) {
    console.log(`  ${line}: ${prop}: ${value}  → off-grid: ${bad.join(', ')}px`)
  }
  console.log('')
}
console.log('Grid: multiples of 4px (8pt base). Exempt: 1–3px strokes, 44px touch target.')

process.exit(process.argv.includes('--strict') ? 1 : 0)
