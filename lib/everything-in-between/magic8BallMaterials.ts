import type { Magic8BallPbrTextures } from '@/lib/everything-in-between/useMagic8BallPbrTextures'
import * as THREE from 'three'

let sharedMaterial: THREE.MeshStandardMaterial | null = null

/** Palla8 — full texture set from /public/models/Magic8Ball_OBJ/Textures/2048 */
export function createMagic8BallPbrMaterial(
  textures: Magic8BallPbrTextures,
): THREE.MeshStandardMaterial {
  if (sharedMaterial) return sharedMaterial

  sharedMaterial = new THREE.MeshStandardMaterial({
    name: 'Palla8',
    map: textures.map,
    aoMap: textures.aoMap,
    aoMapIntensity: 0.75,
    roughnessMap: textures.roughnessMap,
    metalnessMap: textures.metalnessMap,
    emissiveMap: textures.emissiveMap,
    emissive: new THREE.Color(0xffffff),
    emissiveIntensity: 0.35,
    normalMap: textures.normalMap,
    alphaMap: textures.alphaMap,
    transparent: true,
    alphaTest: 0.08,
    depthWrite: true,
    roughness: 1,
    metalness: 1,
    envMapIntensity: 0.85,
  })

  return sharedMaterial
}

export function applyMagic8BallMaterials(
  root: THREE.Object3D,
  textures: Magic8BallPbrTextures,
) {
  const material = createMagic8BallPbrMaterial(textures)
  root.traverse((child) => {
    if (!(child instanceof THREE.Mesh)) return
    child.material = material
    child.frustumCulled = false
  })
}
