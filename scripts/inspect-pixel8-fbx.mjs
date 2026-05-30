/**
 * Dump FBX material names + diffuse colors (run after adding pixel-8-pro.fbx).
 * Usage: node scripts/inspect-pixel8-fbx.mjs [path-to.fbx]
 */
import { readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import * as THREE from 'three'
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const defaultPath = join(
  root,
  'public/models/pixel-8-pro-source/pixel-8-pro.fbx',
)
const fbxPath = resolve(process.argv[2] ?? defaultPath)

const buffer = readFileSync(fbxPath)
const loader = new FBXLoader()
loader.setResourcePath(join(dirname(fbxPath), '/'))
const group = loader.parse(buffer.buffer, dirname(fbxPath))

const materials = new Map()
group.traverse((child) => {
  if (!(child instanceof THREE.Mesh)) return
  const mats = Array.isArray(child.material) ? child.material : [child.material]
  for (const mat of mats) {
    if (!mat || materials.has(mat.uuid)) continue
    const color =
      'color' in mat && mat.color instanceof THREE.Color
        ? `#${mat.color.getHexString()}`
        : null
    materials.set(mat.uuid, {
      name: mat.name,
      type: mat.type,
      color,
      hasMap: !!(mat.map && mat.map.image),
      mapName: mat.map?.name ?? null,
      transparent: mat.transparent,
    })
  }
})

console.log(`FBX: ${fbxPath}`)
console.log(`Materials: ${materials.size}\n`)
for (const m of materials.values()) {
  console.log(
    `${m.name || '(unnamed)'}\t${m.type}\t${m.color ?? '-'}\tmap=${m.hasMap ? 'yes' : 'no'}\t${m.mapName ?? ''}`,
  )
}
