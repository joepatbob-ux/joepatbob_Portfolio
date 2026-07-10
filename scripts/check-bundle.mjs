/**
 * Guard the "entry chunk must never statically import the 3D stack" invariant.
 *
 * vite.config.ts intentionally drops manualChunks (under Rolldown the old
 * grouping fused three + drei + react-dom into one eager chunk). Nothing but a
 * stray static import stands between that and a ballooned entry bundle, so this
 * check fails the build if three.js leaks into the entry, or if the entry grows
 * past a sane ceiling.
 *
 * Run after `vite build`, before prerender rewrites index.html.
 * Run: node scripts/check-bundle.mjs
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
const dist = path.join(root, 'dist')
const assetsDir = path.join(dist, 'assets')

/** Max raw KB for the entry chunk. three.js alone is ~600KB min, so a leak
 * blows well past this; normal entry growth has generous headroom (currently ~120KB). */
const MAX_ENTRY_KB = 400

/** three.js identifiers that survive minification — presence signals the 3D stack. */
const THREE_MARKERS = ['WebGLRenderer', 'BufferGeometry', 'Float32BufferAttribute']

function fail(msg) {
  console.error(`check-bundle: FAIL — ${msg}`)
  process.exit(1)
}

if (!fs.existsSync(dist)) fail('dist/ not found — run `vite build` first')

const indexHtml = fs.readFileSync(path.join(dist, 'index.html'), 'utf8')
const entryMatch = indexHtml.match(
  /<script[^>]*type="module"[^>]*src="\/assets\/(index-[A-Za-z0-9_-]+\.js)"/,
)
if (!entryMatch) fail('could not locate entry chunk <script> in dist/index.html')
const entryFile = entryMatch[1]
const entryPath = path.join(assetsDir, entryFile)
if (!fs.existsSync(entryPath)) fail(`entry chunk ${entryFile} missing from dist/assets`)

// 1) size ceiling
const entryKb = Math.round(fs.statSync(entryPath).size / 1024)
if (entryKb > MAX_ENTRY_KB) {
  fail(`entry chunk ${entryFile} is ${entryKb}KB (> ${MAX_ENTRY_KB}KB ceiling) — likely a heavy static import leaked in`)
}

// 2) three must NOT be in the entry chunk
const entryCode = fs.readFileSync(entryPath, 'utf8')
const leaked = THREE_MARKERS.filter((m) => entryCode.includes(m))
if (leaked.length) {
  fail(`three.js leaked into the entry chunk ${entryFile} (found: ${leaked.join(', ')}) — the 3D stack must stay behind a lazy import`)
}

// 3) three MUST still be bundled somewhere (sanity: it's code-split, not dropped)
const chunks = fs.readdirSync(assetsDir).filter((f) => f.endsWith('.js') && f !== entryFile)
const threeChunk = chunks.find((f) =>
  THREE_MARKERS.some((m) => fs.readFileSync(path.join(assetsDir, f), 'utf8').includes(m)),
)
if (!threeChunk) {
  fail('no chunk contains three.js markers — the marker check may be stale (three renamed/removed); update THREE_MARKERS')
}

console.log(
  `check-bundle: OK — entry ${entryFile} ${entryKb}KB (< ${MAX_ENTRY_KB}KB), three.js isolated in ${threeChunk}`,
)
