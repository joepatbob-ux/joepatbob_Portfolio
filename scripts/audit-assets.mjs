/**
 * Verify static asset paths referenced in source exist under public/.
 * Run: node scripts/audit-assets.mjs
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '..')
const publicDir = path.join(root, 'public')

const SOURCE_DIRS = ['components', 'lib', 'src', 'styles']
const EXTRA_FILES = ['index.html']

/** Literal public URLs with a file extension (skips template fragments). */
const PATH_PATTERN =
  /['"`](\/(?:images|models|textures|fonts|favicon|draco)\/[A-Za-z0-9_./%-]+\.(?:svg|png|webp|jpe?g|gif|glb|obj|mtl|fbx|woff2?|ttf|ico|js|wasm|json))['"`]/g

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

function walk(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name === 'dist') continue
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) walk(full, files)
    else if (/\.(tsx?|jsx?|css|html|mjs)$/.test(entry.name)) files.push(full)
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

function findPathsWithSpaces(dir, base = '') {
  const hits = []
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const rel = base ? `${base}/${entry.name}` : entry.name
    if (entry.name.includes(' ')) hits.push(rel)
    if (entry.isDirectory()) {
      hits.push(...findPathsWithSpaces(path.join(dir, entry.name), rel))
    }
  }
  return hits
}

const refs = collectReferencedPaths()
const missing = refs.filter((ref) => {
  if (OPTIONAL_PATHS.has(ref)) return false
  return !fs.existsSync(path.join(publicDir, ref.slice(1)))
})

const spaces = findPathsWithSpaces(publicDir).filter(
  (p) => !p.includes('touch-2-master/Touch 2 Master.obj'),
)

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

if (!failed) {
  console.log(`audit-assets: OK (${refs.length} references checked)`)
} else {
  process.exit(1)
}
