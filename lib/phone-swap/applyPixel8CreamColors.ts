import * as THREE from 'three'
import {
  PIXEL8_ACCENT_SLOTS,
  PIXEL8_BLACK_SLOTS,
  PIXEL8_BODY_TEXTURE_SLOTS,
  PIXEL8_COLOR_VARIANT,
  PIXEL8_CREAM,
  PIXEL8_GOLD_SLOTS,
  PIXEL8_LOGO_SLOTS,
  PIXEL8_MESH,
  PIXEL8_SPEAKER_GRILLE_SLOTS,
  PIXEL8_SPEAKER_SLOTS,
} from '@/lib/phone-swap/pixel8Assets'
import { meshMaterialSlot } from '@/lib/phone-swap/mergeMeshesByMaterial'

function resolveSlot(mesh: THREE.Mesh): string {
  if (mesh.name.endsWith('SG1')) return mesh.name
  return meshMaterialSlot(mesh)
}

function isDisplayOrGlass(slot: string, mesh: THREE.Mesh): boolean {
  const slotKey = slot.toLowerCase()
  const meshKey = mesh.name.toLowerCase()
  return (
    slot === PIXEL8_MESH.display ||
    slotKey.includes('screen') ||
    meshKey.includes('screen') ||
    slotKey.includes('glass') ||
    meshKey.includes('glass')
  )
}

function isLogoOrSpeaker(slot: string, mesh: THREE.Mesh): boolean {
  const slotKey = slot.toLowerCase()
  const meshKey = mesh.name.toLowerCase()
  if (PIXEL8_LOGO_SLOTS.has(slot) || slotKey.includes('logo') || meshKey.includes('logo')) {
    return true
  }
  if (
    PIXEL8_SPEAKER_GRILLE_SLOTS.has(slot) ||
    PIXEL8_SPEAKER_SLOTS.has(slot) ||
    slotKey.includes('grille') ||
    slotKey.includes('funt') ||
    slotKey.includes('speek') ||
    meshKey.includes('speek')
  ) {
    return true
  }
  return false
}

function isNamedShellSlot(slot: string): boolean {
  if (PIXEL8_BODY_TEXTURE_SLOTS.has(slot)) return true
  const key = slot.toLowerCase()
  return (
    key.includes('polysurface87') ||
    key.includes('polysurface98') ||
    key.includes('pcylinder6') ||
    key.includes('polysurface84') ||
    key.includes('polysurface95')
  )
}

function isGoldColor(color: THREE.Color): boolean {
  return color.r > 0.85 && color.g > 0.55 && color.b < 0.45
}

function isAccentColor(color: THREE.Color): boolean {
  return color.b > 0.85 && color.g > 0.45 && color.r < 0.5
}

function isBlackColor(color: THREE.Color): boolean {
  return color.r < 0.09 && color.g < 0.09 && color.b < 0.09
}

function hasBodyDiffuseMap(mat: THREE.MeshStandardMaterial): boolean {
  if (!mat.map) return false
  const tex = mat.map
  const name = tex.name?.toLowerCase() ?? ''
  if (name.includes('jade') || name.includes('licorice')) return true
  const img = tex.image as { src?: string } | undefined
  return !!img?.src && /jade|licorice/i.test(img.src)
}

function creamHexForSlot(slot: string, color: THREE.Color): number {
  if (slot === 'pCylinder6SG1' || slot === 'polySurface98SG1') {
    return PIXEL8_CREAM.trim
  }
  if (slot === 'polySurface84SG1' || slot === 'polySurface95SG1') {
    return PIXEL8_CREAM.shadow
  }
  const lum = 0.2126 * color.r + 0.7152 * color.g + 0.0722 * color.b
  if (lum > 0.85) return PIXEL8_CREAM.trim
  if (lum < 0.35) return PIXEL8_CREAM.shadow
  return PIXEL8_CREAM.body
}

function shouldApplyCream(
  slot: string,
  mesh: THREE.Mesh,
  mat: THREE.MeshStandardMaterial,
): boolean {
  if (PIXEL8_BLACK_SLOTS.has(slot) || PIXEL8_GOLD_SLOTS.has(slot) || PIXEL8_ACCENT_SLOTS.has(slot)) {
    return false
  }
  if (isGoldColor(mat.color) || isAccentColor(mat.color) || isBlackColor(mat.color)) {
    return false
  }
  if (isNamedShellSlot(slot) || hasBodyDiffuseMap(mat)) return true
  // FBX: unnamed Material # slots — cream anything that isn't accent/gold/black/logo/speaker
  if (/^material #/i.test(slot)) {
    return !isAccentColor(mat.color) && !isGoldColor(mat.color) && !isBlackColor(mat.color)
  }
  return false
}

/** Porcelain / cream body — replaces Bay blue or Jade body atlas on shell slots. */
export function applyPixel8CreamColors(root: THREE.Object3D): number {
  if (PIXEL8_COLOR_VARIANT !== 'cream') return 0

  let count = 0

  root.traverse((child) => {
    if (!(child instanceof THREE.Mesh)) return
    const slot = resolveSlot(child)
    if (isDisplayOrGlass(slot, child)) return
    if (isLogoOrSpeaker(slot, child)) return

    const source = child.material
    const mat = Array.isArray(source) ? source[0] : source
    if (!(mat instanceof THREE.MeshStandardMaterial)) return
    if (!shouldApplyCream(slot, child, mat)) return

    const cream = creamHexForSlot(slot, mat.color)
    mat.color.setHex(cream)
    if (mat.map) mat.map = null
    mat.metalness = slot === 'pCylinder6SG1' ? 0.06 : mat.metalness
    mat.envMapIntensity = 0.88
    mat.name = slot
    mat.needsUpdate = true
    count += 1
  })

  return count
}
