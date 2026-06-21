import * as THREE from 'three'
import {
  PIXEL8_ACCENT_SLOTS,
  PIXEL8_BLACK_SLOTS,
  PIXEL8_BODY_TEXTURE_SLOTS,
  PIXEL8_DISPLAY,
  PIXEL8_DISPLAY_RENDER_ORDER,
  PIXEL8_GOLD_SLOTS,
  PIXEL8_JADE,
  PIXEL8_LOGO_SLOTS,
  PIXEL8_MESH,
  PIXEL8_SPEAKER_GRILLE_SLOTS,
  PIXEL8_SPEAKER_SLOTS,
  type Pixel8MaterialMaps,
} from '@/lib/phone-swap/pixel8Assets'
import { applyPixel8Screen } from '@/lib/phone-swap/applyScreenTextures'
import { nudgeGeometryAlongNormals } from '@/lib/phone-swap/fitScreenTextureToMesh'
import { meshMaterialSlot } from '@/lib/phone-swap/mergeMeshesByMaterial'
import { mtlPhongToStandard } from '@/lib/phone-swap/mtlPhongToStandard'

/** Unlit bezel — stays visible at grazing angles during swap rotation. */
function pixel8BezelMaterial(): THREE.MeshBasicMaterial {
  return new THREE.MeshBasicMaterial({
    name: PIXEL8_MESH.glass,
    color: PIXEL8_DISPLAY.bezel,
    toneMapped: false,
    side: THREE.FrontSide,
    depthTest: true,
    depthWrite: false,
  })
}

function applyPixel8BezelMesh(child: THREE.Mesh): void {
  child.geometry = child.geometry.clone()
  nudgeGeometryAlongNormals(child.geometry, PIXEL8_DISPLAY.bezelNudge)
  child.material = pixel8BezelMaterial()
  child.visible = true
  child.renderOrder = PIXEL8_DISPLAY_RENDER_ORDER.bezel
  child.frustumCulled = false
}

/** Black glass frame + camera cutout ring (export `glassSG1` — was hidden). */
export function applyPixel8FrontBezel(root: THREE.Object3D): number {
  let count = 0

  root.traverse((child) => {
    if (!(child instanceof THREE.Mesh)) return
    const slot = resolveSlot(child)
    if (slot !== PIXEL8_MESH.glass) return

    applyPixel8BezelMesh(child)
    count += 1
  })

  return count
}

function cloneSrgbMap(source: THREE.Texture): THREE.Texture {
  const map = source.clone()
  map.colorSpace = THREE.SRGBColorSpace
  map.needsUpdate = true
  return map
}

function cloneAlphaMap(source: THREE.Texture): THREE.Texture {
  const map = source.clone()
  map.colorSpace = THREE.NoColorSpace
  map.needsUpdate = true
  return map
}

function bodySolidColorForSlot(slotName: string): number {
  if (slotName === 'pCylinder6SG1' || slotName === 'polySurface98SG1') {
    return PIXEL8_JADE.trim
  }
  if (slotName === 'polySurface84SG1' || slotName === 'polySurface95SG1') {
    return PIXEL8_JADE.shadow
  }
  return PIXEL8_JADE.body
}

function bodySolidMaterial(slotName: string): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    name: slotName,
    color: bodySolidColorForSlot(slotName),
    metalness: slotName === 'pCylinder6SG1' ? 0.06 : 0.08,
    roughness:
      slotName === 'polySurface84SG1' || slotName === 'polySurface95SG1'
        ? 0.52
        : 0.46,
    envMapIntensity: 0.55,
    side: THREE.FrontSide,
  })
}

function bodyAtlasMaterial(
  maps: Pixel8MaterialMaps,
  slotName: string,
): THREE.MeshStandardMaterial {
  const map = cloneSrgbMap(maps.bodyAtlas!)
  // polySurface87 UVs span ~−20…13 — Repeat samples the Max atlas correctly.
  map.wrapS = THREE.RepeatWrapping
  map.wrapT = THREE.RepeatWrapping
  map.flipY = false

  return new THREE.MeshStandardMaterial({
    name: slotName,
    color: 0xffffff,
    map,
    metalness: 0.08,
    roughness: 0.52,
    envMapIntensity: 0.55,
    side: THREE.FrontSide,
  })
}

function logoMaterial(
  source: THREE.Material,
  maps: Pixel8MaterialMaps,
  slotName: string,
): THREE.MeshStandardMaterial {
  const mat = mtlPhongToStandard(source, {
    name: slotName,
    color: PIXEL8_DISPLAY.backing,
    metalness: 0.12,
    roughness: 0.42,
    envMapIntensity: 0.7,
  })
  mat.alphaMap = cloneAlphaMap(maps.logoAlpha)
  mat.transparent = true
  mat.alphaTest = 0.04
  mat.depthWrite = false
  mat.toneMapped = true
  return mat
}

function speakerMaterial(
  source: THREE.Material,
  maps: Pixel8MaterialMaps,
  slotName: string,
): THREE.MeshStandardMaterial {
  const mat = mtlPhongToStandard(source, {
    name: slotName,
    metalness: 0.1,
    roughness: 0.58,
    envMapIntensity: 0.55,
  })
  mat.alphaMap = cloneAlphaMap(maps.speakerAlpha!)
  mat.transparent = true
  mat.depthWrite = false
  return mat
}

function speakerGrilleMaterial(
  source: THREE.Material,
  maps: Pixel8MaterialMaps,
  slotName: string,
): THREE.MeshStandardMaterial {
  const mat = mtlPhongToStandard(source, {
    name: slotName,
    metalness: 0.12,
    roughness: 0.55,
  })
  mat.alphaMap = cloneAlphaMap(maps.speakerGrilleAlpha)
  mat.transparent = true
  mat.depthWrite = false
  return mat
}

function slotOverrides(slotName: string): {
  metalness?: number
  roughness?: number
  envMapIntensity?: number
} {
  if (PIXEL8_GOLD_SLOTS.has(slotName)) {
    return { metalness: 0.82, roughness: 0.28, envMapIntensity: 1.25 }
  }
  if (PIXEL8_ACCENT_SLOTS.has(slotName)) {
    return { metalness: 0.22, roughness: 0.42, envMapIntensity: 1 }
  }
  if (PIXEL8_BLACK_SLOTS.has(slotName)) {
    return { metalness: 0.1, roughness: 0.6, envMapIntensity: 0.5 }
  }
  if (PIXEL8_BODY_TEXTURE_SLOTS.has(slotName)) {
    return { metalness: 0.08, roughness: 0.52, envMapIntensity: 0.6 }
  }
  return {}
}

function standardFromMtl(
  slotName: string,
  source: THREE.Material,
  maps: Pixel8MaterialMaps,
): THREE.MeshStandardMaterial {
  if (maps.bodyAtlas && PIXEL8_BODY_TEXTURE_SLOTS.has(slotName)) {
    return bodyAtlasMaterial(maps, slotName)
  }
  if (PIXEL8_BODY_TEXTURE_SLOTS.has(slotName)) {
    return bodySolidMaterial(slotName)
  }
  if (PIXEL8_LOGO_SLOTS.has(slotName)) {
    return logoMaterial(source, maps, slotName)
  }
  if (PIXEL8_SPEAKER_GRILLE_SLOTS.has(slotName)) {
    return speakerGrilleMaterial(source, maps, slotName)
  }
  if (maps.speakerAlpha && PIXEL8_SPEAKER_SLOTS.has(slotName)) {
    return speakerMaterial(source, maps, slotName)
  }

  return mtlPhongToStandard(source, {
    name: slotName,
    ...slotOverrides(slotName),
  })
}

function resolveSlot(mesh: THREE.Mesh): string {
  if (mesh.name.endsWith('SG1')) return mesh.name
  return meshMaterialSlot(mesh)
}

function isLogoMesh(mesh: THREE.Mesh, slot: string): boolean {
  const slotKey = slot.toLowerCase()
  const meshKey = mesh.name.toLowerCase()
  return (
    PIXEL8_LOGO_SLOTS.has(slot) ||
    slotKey === 'logo' ||
    slotKey.includes('logo') ||
    meshKey.includes('logo')
  )
}

function isSpeakerGrilleMesh(mesh: THREE.Mesh, slot: string): boolean {
  const slotKey = slot.toLowerCase()
  const meshKey = mesh.name.toLowerCase()
  return (
    PIXEL8_SPEAKER_GRILLE_SLOTS.has(slot) ||
    slotKey.includes('grille') ||
    slotKey.includes('funt') ||
    meshKey.includes('grille')
  )
}

function isSpeakerMesh(mesh: THREE.Mesh, slot: string): boolean {
  if (isSpeakerGrilleMesh(mesh, slot)) return false
  if (PIXEL8_SPEAKER_SLOTS.has(slot)) return true
  const slotKey = slot.toLowerCase()
  const meshKey = mesh.name.toLowerCase()
  return slotKey.includes('speek') || meshKey.includes('speek')
}

/** Apply pixel-8-pro-tex cutouts on top of FBX/OBJ materials (logo, speakers). */
export function applyPixel8DetailMaps(
  root: THREE.Object3D,
  maps: Pixel8MaterialMaps,
): number {
  let count = 0

  root.traverse((child) => {
    if (!(child instanceof THREE.Mesh)) return
    const slot = resolveSlot(child)
    if (slot === PIXEL8_MESH.display) return
    if (slot === PIXEL8_MESH.glass) return

    const source = child.material
    const sourceMat = Array.isArray(source) ? source[0] : source

    if (isLogoMesh(child, slot)) {
      child.material = logoMaterial(sourceMat, maps, slot)
      child.frustumCulled = false
      count += 1
      return
    }
    if (isSpeakerGrilleMesh(child, slot)) {
      child.material = speakerGrilleMaterial(sourceMat, maps, slot)
      child.frustumCulled = false
      count += 1
      return
    }
    if (maps.speakerAlpha && isSpeakerMesh(child, slot)) {
      child.material = speakerMaterial(sourceMat, maps, slot)
      child.frustumCulled = false
      count += 1
    }
  })

  return count
}

export function applyPixel8MtlMaterials(
  root: THREE.Object3D,
  maps: Pixel8MaterialMaps,
): number {
  let count = 0

  root.traverse((child) => {
    if (!(child instanceof THREE.Mesh)) return
    const slot = resolveSlot(child)
    if (slot === PIXEL8_MESH.display) return
    if (slot === PIXEL8_MESH.glass) {
      applyPixel8BezelMesh(child)
      count += 1
      return
    }

    const source = child.material
    const sourceMat = Array.isArray(source) ? source[0] : source

    child.name = slot
    child.material = standardFromMtl(slot, sourceMat, maps)
    child.frustumCulled = false
    count += 1
  })

  return count
}

export function applyPixel8Display(
  root: THREE.Object3D,
  screenTexture: THREE.Texture,
  maps: Pixel8MaterialMaps,
): number {
  applyPixel8MtlMaterials(root, maps)
  return applyPixel8Screen(root, screenTexture)
}

export function countPhongMaterials(root: THREE.Object3D): number {
  let n = 0
  root.traverse((child) => {
    if (!(child instanceof THREE.Mesh)) return
    const mat = child.material
    const mats = Array.isArray(mat) ? mat : [mat]
    if (mats.some((m) => m instanceof THREE.MeshPhongMaterial)) n += 1
  })
  return n
}
