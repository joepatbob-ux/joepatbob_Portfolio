import * as THREE from 'three'
import {
  generateScreenUVsFromPosition,
  nudgeGeometryAlongNormals,
  remapDisplayUVFlipV,
  remapMeshUVsTo01,
  screenTextureForDisplay,
} from '@/lib/phone-swap/fitScreenTextureToMesh'
import { debugLog } from '@/lib/phone-swap/debugLog'

import {
  IPHONE16_DISPLAY,
  IPHONE16_DISPLAY_RENDER_ORDER,
  IPHONE16_FRONT_OVERLAY_OBJECTS,
  IPHONE16_MESH,
} from '@/lib/phone-swap/iphone16Assets'
import { PIXEL8_DISPLAY, PIXEL8_DISPLAY_RENDER_ORDER, PIXEL8_MESH, PIXEL8_MIRROR_X } from '@/lib/phone-swap/pixel8Assets'
import { PIXEL9_MESH } from '@/lib/phone-swap/pixel9Assets'
import { meshMaterialSlot } from '@/lib/phone-swap/mergeMeshesByMaterial'

export { IPHONE16_MESH } from '@/lib/phone-swap/iphone16Assets'
export { PIXEL9_MESH } from '@/lib/phone-swap/pixel9Assets'

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
  let backingGeometry: THREE.BufferGeometry | null = null

  root.traverse((child) => {
    if (!(child instanceof THREE.Mesh)) return
    if (child.name !== IPHONE16_MESH.display) return

    child.geometry = child.geometry.clone()
    generateScreenUVsFromPosition(child, true)
    const atlasUV = remapDisplayUVFlipV(child)
    backingGeometry = child.geometry.clone()
    nudgeGeometryAlongNormals(child.geometry, IPHONE16_DISPLAY.surfaceNudge)
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
      color: 0xffffff,
      toneMapped: false,
      depthTest: true,
      depthWrite: true,
      side: THREE.FrontSide,
      polygonOffset: true,
      polygonOffsetFactor: -4,
      polygonOffsetUnits: -8,
    })
    child.renderOrder = IPHONE16_DISPLAY_RENDER_ORDER.screen
    child.frustumCulled = false
    count += 1
  })

  if (count > 0 && backingGeometry) {
    applyIPhone16ScreenBacking(root, backingGeometry)
  }

  return count
}

function findIPhone16DisplayMesh(root: THREE.Object3D): THREE.Mesh | null {
  const mesh = root.getObjectByName(IPHONE16_MESH.display)
  return mesh instanceof THREE.Mesh ? mesh : null
}

function applyIPhone16ScreenBacking(
  root: THREE.Object3D,
  backingGeometry: THREE.BufferGeometry,
): number {
  const display = findIPhone16DisplayMesh(root)
  if (!display?.parent) return 0

  const parent = display.parent
  const existing = parent.getObjectByName(IPHONE16_MESH.displayBacking)
  if (existing) {
    existing.parent?.remove(existing)
    if (existing instanceof THREE.Mesh) {
      existing.geometry.dispose()
      const mat = existing.material
      if (Array.isArray(mat)) mat.forEach((m) => m.dispose())
      else mat.dispose()
    }
  }

  const backing = new THREE.Mesh(
    backingGeometry,
    new THREE.MeshBasicMaterial({
      name: IPHONE16_MESH.displayBacking,
      color: IPHONE16_DISPLAY.backing,
      toneMapped: false,
      depthTest: true,
      depthWrite: true,
      side: THREE.FrontSide,
    }),
  )
  backing.name = IPHONE16_MESH.displayBacking
  backing.position.copy(display.position)
  backing.quaternion.copy(display.quaternion)
  backing.scale.copy(display.scale)
  backing.renderOrder = IPHONE16_DISPLAY_RENDER_ORDER.backing
  backing.frustumCulled = false
  parent.add(backing)

  return 1
}

function iphone16BezelMaterial(): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    name: IPHONE16_MESH.glass,
    color: IPHONE16_DISPLAY.bezel,
    metalness: 0.12,
    roughness: 0.58,
    envMapIntensity: 0.45,
    side: THREE.FrontSide,
    depthTest: true,
    depthWrite: false,
    polygonOffset: true,
    polygonOffsetFactor: 2,
    polygonOffsetUnits: 6,
  })
}

/** Black front glass frame (`Glass` mesh — was hidden). */
export function applyIPhone16FrontBezel(root: THREE.Object3D): number {
  let count = 0

  root.traverse((child) => {
    if (!(child instanceof THREE.Mesh)) return
    if (child.name !== IPHONE16_MESH.glass) return

    child.material = iphone16BezelMaterial()
    child.visible = true
    child.renderOrder = IPHONE16_DISPLAY_RENDER_ORDER.bezel
    child.frustumCulled = false
    count += 1
  })

  return count
}

/** Dynamic Island + front sensors render above the screenshot. */
export function applyIPhone16FrontOverlays(root: THREE.Object3D): number {
  let count = 0

  root.traverse((child) => {
    if (!(child instanceof THREE.Mesh)) return
    if (!IPHONE16_FRONT_OVERLAY_OBJECTS.has(child.name)) return

    child.renderOrder = IPHONE16_DISPLAY_RENDER_ORDER.overlay
    child.frustumCulled = false
    count += 1
  })

  return count
}

/** UI screenshot on Pixel 9 Pro display mesh (UVs already 0–1 in export). */
export function applyPixel9Screen(
  root: THREE.Object3D,
  screenTexture: THREE.Texture,
): number {
  let count = 0

  root.traverse((child) => {
    if (!(child instanceof THREE.Mesh)) return
    if (
      child.name !== PIXEL9_MESH.display &&
      meshMaterialName(child) !== PIXEL9_MESH.display
    ) {
      return
    }

    child.geometry = child.geometry.clone()
    const atlasUV = remapMeshUVsTo01(child)
    const map = screenTextureForDisplay(screenTexture)
    if (map.image) map.needsUpdate = true

    // #region agent log
    debugLog(
      'applyScreenTextures.tsx:pixel9Screen',
      'display UV remapped on merged mesh',
      { meshName: child.name, atlasUV, flipY: map.flipY },
      'U',
      'pixel9-merge-fix',
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

function isPixel8DisplayMesh(mesh: THREE.Mesh): boolean {
  if (mesh.name === PIXEL8_MESH.displayBacking) return false
  const slot = meshMaterialSlot(mesh)
  const meshKey = mesh.name.toLowerCase()
  const slotKey = slot.toLowerCase()
  return (
    mesh.name === PIXEL8_MESH.display ||
    slot === PIXEL8_MESH.display ||
    (meshKey.includes('screen') && !meshKey.includes('backing')) ||
    (slotKey.includes('screen') && !slotKey.includes('backing'))
  )
}

function findPixel8DisplayMesh(root: THREE.Object3D): THREE.Mesh | null {
  let found: THREE.Mesh | null = null
  root.traverse((child) => {
    if (found) return
    if (child instanceof THREE.Mesh && isPixel8DisplayMesh(child)) {
      found = child
    }
  })
  return found
}

/** OLED well behind the screenshot — fills bezel gaps and cutout edges. */
export function applyPixel8ScreenBacking(
  root: THREE.Object3D,
  backingGeometry: THREE.BufferGeometry,
): number {
  const display = findPixel8DisplayMesh(root)
  if (!display) return 0

  const parent = display.parent
  if (!parent) return 0

  const existing = parent.getObjectByName(PIXEL8_MESH.displayBacking)
  if (existing) {
    existing.parent?.remove(existing)
    if (existing instanceof THREE.Mesh) {
      existing.geometry.dispose()
      const mat = existing.material
      if (Array.isArray(mat)) mat.forEach((m) => m.dispose())
      else mat.dispose()
    }
  }

  const backing = new THREE.Mesh(
    backingGeometry,
    new THREE.MeshBasicMaterial({
      name: PIXEL8_MESH.displayBacking,
      color: PIXEL8_DISPLAY.backing,
      toneMapped: false,
      depthTest: true,
      depthWrite: false,
      side: THREE.FrontSide,
    }),
  )
  backing.name = PIXEL8_MESH.displayBacking
  backing.position.copy(display.position)
  backing.quaternion.copy(display.quaternion)
  backing.scale.copy(display.scale)
  backing.renderOrder = PIXEL8_DISPLAY_RENDER_ORDER.backing
  backing.frustumCulled = false
  parent.add(backing)

  return 1
}

/** Stock wallpaper on Pixel 8 Pro display (screenSG1 or FBX screen mesh). */
export function applyPixel8Screen(
  root: THREE.Object3D,
  screenTexture: THREE.Texture,
): number {
  let count = 0
  let backingGeometry: THREE.BufferGeometry | null = null

  root.traverse((child) => {
    if (!(child instanceof THREE.Mesh)) return
    if (!isPixel8DisplayMesh(child)) return

    child.geometry = child.geometry.clone()
    child.geometry.deleteAttribute('uv')
    generateScreenUVsFromPosition(child, PIXEL8_MIRROR_X)
    child.name = PIXEL8_MESH.display
    if (process.env.NODE_ENV !== 'production') {
      const uvAttr = child.geometry.getAttribute('uv')
      console.error(
        '[Pixel8Screen]', child.name,
        uvAttr
          ? `UV OK: ${uvAttr.count} verts, first=(${uvAttr.getX(0).toFixed(3)},${uvAttr.getY(0).toFixed(3)})`
          : 'UV MISSING after generation',
      )
    }
    remapDisplayUVFlipV(child)
    backingGeometry = child.geometry.clone()
    nudgeGeometryAlongNormals(child.geometry, PIXEL8_DISPLAY.surfaceNudge)
    const map = screenTextureForDisplay(screenTexture)
    if (map.image) map.needsUpdate = true

    child.material = new THREE.MeshBasicMaterial({
      map,
      color: 0xffffff,
      toneMapped: false,
      depthTest: true,
      depthWrite: true,
      // Baked normals point +X; default pose rotates Y≈90° so FrontSide faces away from +Z camera.
      side: THREE.DoubleSide,
      polygonOffset: true,
      polygonOffsetFactor: -2,
      polygonOffsetUnits: -4,
    })
    child.renderOrder = PIXEL8_DISPLAY_RENDER_ORDER.screen
    child.frustumCulled = false
    count += 1
  })

  if (count > 0 && backingGeometry) {
    applyPixel8ScreenBacking(root, backingGeometry)
  }

  finalizePixel8DisplayStack(root)

  return count
}

/** Keep OLED backing → bezel → PNG as the last-drawn subtree on the model. */
export function finalizePixel8DisplayStack(root: THREE.Object3D): void {
  const stackNames = new Set<string>([
    PIXEL8_MESH.displayBacking,
    PIXEL8_MESH.glass,
    PIXEL8_MESH.display,
  ])
  const meshes: THREE.Mesh[] = []

  root.traverse((child) => {
    if (child instanceof THREE.Mesh && stackNames.has(child.name)) {
      meshes.push(child)
    }
  })

  if (meshes.length === 0) return

  const parent = meshes[0].parent
  if (!parent) return

  const existing = parent.getObjectByName('pixel8DisplayStack')
  if (existing) existing.parent?.remove(existing)

  const stack = new THREE.Group()
  stack.name = 'pixel8DisplayStack'
  stack.renderOrder = PIXEL8_DISPLAY_RENDER_ORDER.backing
  parent.add(stack)

  const order = [
    PIXEL8_MESH.displayBacking,
    PIXEL8_MESH.glass,
    PIXEL8_MESH.display,
  ]
  for (const name of order) {
    const mesh = meshes.find((m) => m.name === name)
    if (mesh) stack.attach(mesh)
  }
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
