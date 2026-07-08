/**
 * Remove local-only / orphan assets from dist before deploy.
 * Keeps public/images/_archive/ in the repo for reference without shipping ~7MB.
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '..')

const STRIP_PATHS = ['dist/images/_archive']

for (const rel of STRIP_PATHS) {
  const target = path.join(root, rel)
  if (!fs.existsSync(target)) continue
  fs.rmSync(target, { recursive: true, force: true })
  console.log(`[strip-deploy-assets] removed ${rel}`)
}
