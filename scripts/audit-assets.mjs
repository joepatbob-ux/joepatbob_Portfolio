/**
 * Verify static asset paths referenced in source exist under public/,
 * catch orphans, empty imageAlt, and case/space path issues.
 *
 * Run: npm run audit:assets
 */
import fs from 'node:fs'
import path from 'node:path'
import { execSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '..')
const publicDir = path.join(root, 'public')

const SOURCE_DIRS = ['components', 'lib', 'src', 'styles', 'content']
const EXTRA_FILES = ['index.html']
const SECTION_FILES = ['lib/sections/hardware.ts', 'lib/sections/mobile.ts', 'lib/sections/webapps.ts', 'lib/sections/everything-else.ts']

/** Literal public URLs with a file extension (skips template fragments). */
const PATH_PATTERN =
  /['"`](\/(?:images|models|textures|fonts|favicon|draco)\/[A-Za-z0-9_./%-]+\.(?:svg|png|webp|jpe?g|gif|glb|obj|mtl|fbx|woff2?|ttf|ico|js|wasm|json))['"`]/g

/** Paths built dynamically in code — any file under these prefixes counts as referenced. */
const PREFIX_COVERED = [
  '/images/lego/',
  '/images/verdant-segment/',
  '/images/sensi-lite/',
  '/images/sma-ios26/',
  '/images/stickers/',
  '/images/touch-2/',
  '/images/screens/',
  '/images/devices/',
  '/images/web-apps/',
  '/images/preloader/',
  '/images/_archive/',
  '/models/',
  '/textures/',
  '/favicon/',
  '/draco/',
  '/fonts/',
]

/** Intentional mixed-case directory names (vendor bundles). */
const ALLOWED_UPPERCASE_DIR_SEGMENTS = new Set(['Magic8Ball_OBJ', 'Textures'])

/** Site/static files not linked from app source (or referenced outside the
 * PATH_PATTERN scope, e.g. the root-level OG image in index.html's meta tags). */
const ORPHAN_ALLOWED = new Set([
  '/404.html',
  '/robots.txt',
  '/sitemap.xml',
  '/og-share.jpg',
])

/** Optional local-only assets (gitignored exports). */
const OPTIONAL_PATHS = new Set([
  '/models/touch-2-master/Touch 2 Master.obj',
  '/models/touch-2-master/touch-2-master.mtl',
  '/models/pixel-8-pro-source/pixel-8-pro.fbx',
  '/models/glass-bowl-a/glass_bowl_a/glass_bowl_a_Mat_baseColor.png',
  '/models/glass-bowl-a/glass_bowl_a/glass_bowl_a_Mat_metallic.png',
  '/models/glass-bowl-a/glass_bowl_a/glass_bowl_a_Mat_normal.png',
  '/models/glass-bowl-a/glass_bowl_a/glass_bowl_a_Mat_opacity.png',
  '/models/glass-bowl-a/glass_bowl_a/glass_bowl_a_Mat_roughness.png',
  '/models/glass-bowl-a/glass_bowl_a/glass_bowl_a_Mat_translucence.png',
])

const SPACE_ALLOWED = ['models/touch-2-master/Touch 2 Master.obj']

function walk(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name === 'dist') continue
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) walk(full, files)
    else if (/\.(tsx?|jsx?|css|html|mjs|mdc|md)$/.test(entry.name)) files.push(full)
  }
  return files
}

function collectReferencedPaths() {
  const refs = new Set()
  const files = [...EXTRA_FILES.map((f) => path.join(root, f))]
  for (const rel of SOURCE_DIRS) {
    const abs = path.join(root, rel)
    if (fs.existsSync(abs)) files.push(...walk(abs))
  }
  for (const file of files) {
    if (!fs.existsSync(file)) continue
    const text = fs.readFileSync(file, 'utf8')
    for (const match of text.matchAll(PATH_PATTERN)) {
      refs.add(decodeURIComponent(match[1]))
    }
  }
  return [...refs].sort()
}

function isPrefixCovered(publicPath) {
  return PREFIX_COVERED.some((prefix) => publicPath.startsWith(prefix))
}

function isReferenced(publicPath, literalRefs) {
  if (literalRefs.has(publicPath)) return true
  if (OPTIONAL_PATHS.has(publicPath)) return true
  if (isPrefixCovered(publicPath)) return true
  return false
}

function findPathsWithSpaces(dir, base = '') {
  const hits = []
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const rel = base ? `${base}/${entry.name}` : entry.name
    if (entry.name.includes(' ') && !SPACE_ALLOWED.includes(rel)) hits.push(rel)
    if (entry.isDirectory()) {
      hits.push(...findPathsWithSpaces(path.join(dir, entry.name), rel))
    }
  }
  return hits
}

function findUppercaseDirSegmentsInGit(trackedFiles) {
  const hits = new Set()
  for (const publicPath of trackedFiles) {
    const segments = publicPath.split('/').filter(Boolean)
    for (let i = 0; i < segments.length - 1; i++) {
      const seg = segments[i]
      if (seg !== seg.toLowerCase() && !ALLOWED_UPPERCASE_DIR_SEGMENTS.has(seg)) {
        hits.add(segments.slice(0, i + 1).join('/'))
      }
    }
  }
  return [...hits].sort()
}

function findEmptyImageAlts() {
  const hits = []
  const contentDir = path.join(root, 'content')
  const files = [...SECTION_FILES.map((f) => path.join(root, f))]
  if (fs.existsSync(contentDir)) files.push(...walk(contentDir))

  for (const file of files) {
    if (!fs.existsSync(file)) continue
    const lines = fs.readFileSync(file, 'utf8').split('\n')
    lines.forEach((line, index) => {
      if (/imageAlt:\s*''/.test(line) || /"imageAlt":\s*""/.test(line)) {
        hits.push(`${path.relative(root, file)}:${index + 1}`)
      }
    })
  }
  return hits
}

function findCaseMismatchesInSource(literalRefs) {
  const hits = []
  for (const ref of literalRefs) {
    const segments = ref.split('/').filter(Boolean)
    for (let i = 0; i < segments.length - 1; i++) {
      const seg = segments[i]
      if (seg !== seg.toLowerCase() && !ALLOWED_UPPERCASE_DIR_SEGMENTS.has(seg)) {
        hits.push(ref)
        break
      }
    }
  }
  return [...new Set(hits)]
}

function listTrackedPublicFiles() {
  try {
    const out = execSync('git ls-files public', { cwd: root, encoding: 'utf8' })
    return out
      .trim()
      .split('\n')
      .filter(Boolean)
      .map((p) => '/' + p.replace(/^public\/?/, ''))
  } catch {
    return []
  }
}

function isOrphanAllowed(publicPath) {
  if (ORPHAN_ALLOWED.has(publicPath)) return true
  if (publicPath.endsWith('.DS_Store')) return true
  if (publicPath.endsWith('.gitkeep')) return true
  if (publicPath.endsWith('/README.md') && publicPath.includes('_archive')) return true
  return false
}

const literalRefs = new Set(collectReferencedPaths())
const missing = [...literalRefs].filter((ref) => {
  if (OPTIONAL_PATHS.has(ref)) return false
  return !fs.existsSync(path.join(publicDir, ref.slice(1)))
})

const spaces = findPathsWithSpaces(publicDir)
const tracked = listTrackedPublicFiles()
const uppercaseSegments = findUppercaseDirSegmentsInGit(tracked)
const emptyAlts = findEmptyImageAlts()
const caseMismatches = findCaseMismatchesInSource(literalRefs)

const orphans = tracked.filter((publicPath) => {
  if (isOrphanAllowed(publicPath)) return false
  return !isReferenced(publicPath, literalRefs)
})

let failed = false

if (missing.length) {
  failed = true
  console.error('Missing referenced assets:')
  for (const m of missing) console.error(`  ${m}`)
}

if (spaces.length) {
  failed = true
  console.error('Paths with spaces under public/:')
  for (const s of spaces) console.error(`  ${s}`)
}

if (uppercaseSegments.length) {
  failed = true
  console.error('Uppercase path segments under public/ (breaks on Linux):')
  for (const s of uppercaseSegments) console.error(`  ${s}`)
}

if (caseMismatches.length) {
  failed = true
  console.error('Source references with uppercase URL segments:')
  for (const s of caseMismatches) console.error(`  ${s}`)
}

if (emptyAlts.length) {
  failed = true
  console.error('Empty imageAlt in section data:')
  for (const s of emptyAlts) console.error(`  ${s}`)
}

if (orphans.length) {
  failed = true
  console.error('Tracked public/ files not referenced in source:')
  for (const o of orphans) console.error(`  ${o}`)
}

if (!failed) {
  console.log(
    `audit-assets: OK (${literalRefs.size} literal refs, ${tracked.length} tracked public files)`,
  )
} else {
  process.exit(1)
}
