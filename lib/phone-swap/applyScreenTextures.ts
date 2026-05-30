import * as THREE from 'three'
import {
  remapDisplayUVFlipV,
  remapMeshUVsTo01,
  screenTextureForDisplay,
} from '@/lib/phone-swap/fitScreenTextureToMesh'
import { debugLog } from '@/lib/phone-swap/debugLog'

import { IPHONE16_MESH } from '@/lib/phone-swap/iphone16Assets'

export { IPHONE16_MESH } from '@/lib/phone-swap/iphone16Assets'

export const ANDROID_MESH = {
  body: 'smartphone_03',
  display: 'smartphone_03_display',
  glass: 'smartphone_03_glass',
} as const

function meshMaterialName(mesh: THREE.Mesh): string | undefined {
  const mat = mesh.material
  if (Array.isArray(mat)) return mat[0]?.name
  return mat?.name
}

/** UI screenshot on iPhone Screen mesh (UVs remapped to 0–1). */
export function applyIPhoneScreen(
  root: THREE.Object3D,
  screenTexture: THREE.Texture,
): number {
  let count = 0

  root.traverse((child) => {
    if (!(child instanceof THREE.Mesh)) return
    if (child.name !== 'Screen' && meshMaterialName(child) !== 'Screen_mat') {
      return
    }

    child.geometry = child.geometry.clone()
    const atlasUV = remapMeshUVsTo01(child)
    const map = screenTextureForDisplay(screenTexture)
    if (map.image) map.needsUpdate = true

    // #region agent log
    debugLog(
      'applyScreenTextures.tsx:iPhoneScreen',
      'display UV remapped to 0-1',
      { meshName: child.name, atlasUV, flipY: map.flipY },
      'U',
      'post-fix',
    )
    // #endregion

    child.material = new THREE.MeshBasicMaterial({
      map,
      toneMapped: false,
      depthTest: true,
      depthWrite: true,
      side: THREE.FrontSide,
    })
    child.renderOrder = 30
    child.frustumCulled = false
    count += 1
  })

  return count
}

/** UI screenshot on iphone16 display mesh (same pipeline as Android display). */
export function applyIPhone16Screen(
  root: THREE.Object3D,
  screenTexture: THREE.Texture,
): number {
  let count = 0

  root.traverse((child) => {
    if (!(child instanceof THREE.Mesh)) return
    if (child.name !== IPHONE16_MESH.display) return

    child.geometry = child.geometry.clone()
    const atlasUV = remapDisplayUVFlipV(child)
    const map = screenTextureForDisplay(screenTexture)
    if (map.image) map.needsUpdate = true

    // #region agent log
    debugLog(
      'applyScreenTextures.tsx:iPhone16Screen',
      'display UV remapped, V flipped',
      { meshName: child.name, atlasUV, flipY: map.flipY, uvFlipV: true },
      'U',
      'iphone-screen-flip-v',
    )
    // #endregion

    child.material = new THREE.MeshBasicMaterial({
      map,
      toneMapped: false,
      depthTest: true,
      depthWrite: true,
      side: THREE.FrontSide,
    })
    child.renderOrder = 30
    child.frustumCulled = false
    count += 1
  })

  return count
}

export type AndroidGlassMaps = {
  normal: THREE.Texture
  roughness: THREE.Texture
}

/** Glass / reflection shell above the display. */
export function applyAndroidGlass(
  root: THREE.Object3D,
  maps: AndroidGlassMaps,
): number {
  maps.normal.colorSpace = THREE.NoColorSpace
  maps.roughness.colorSpace = THREE.NoColorSpace

  let count = 0
  root.traverse((child) => {
    if (!(child instanceof THREE.Mesh)) return
    if (child.name !== ANDROID_MESH.glass) return

    child.material = new THREE.MeshPhysicalMaterial({
      transparent: true,
      opacity: 0.08,
      transmission: 0.15,
      thickness: 0.15,
      ior: 1.45,
      roughness: 0.02,
      metalness: 0,
      normalMap: maps.normal,
      roughnessMap: maps.roughness,
      envMapIntensity: 0.85,
      depthWrite: false,
      side: THREE.DoubleSide,
      toneMapped: true,
    })
    child.renderOrder = 20
    child.frustumCulled = false
    count += 1
  })

  return count
}

/** UI screenshot on the display mesh (UVs remapped to 0–1, then Android.png). */
export function applyAndroidScreen(
  root: THREE.Object3D,
  screenTexture: THREE.Texture,
): number {
  let count = 0

  root.traverse((child) => {
    if (!(child instanceof THREE.Mesh)) return
    if (child.name !== ANDROID_MESH.display) return

    child.geometry = child.geometry.clone()
    const atlasUV = remapMeshUVsTo01(child)
    const map = screenTextureForDisplay(screenTexture)
    if (map.image) {
      map.needsUpdate = true
    }

    // #region agent log
    debugLog(
      'applyScreenTextures.tsx:androidScreen',
      'display UV remapped to 0-1',
      { meshName: child.name, atlasUV, flipY: map.flipY },
      'U',
      'post-fix',
    )
    // #endregion

    child.material = new THREE.MeshBasicMaterial({
      map,
      toneMapped: false,
      depthTest: true,
      depthWrite: true,
      side: THREE.FrontSide,
    })
    child.renderOrder = 30
    child.frustumCulled = false
    count += 1
  })

  return count
}
