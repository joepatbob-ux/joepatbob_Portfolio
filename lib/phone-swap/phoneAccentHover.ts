import * as THREE from 'three'
import { ANDROID_MESH } from '@/lib/phone-swap/applyScreenTextures'
import { IPHONE16_MESH } from '@/lib/phone-swap/iphone16Assets'
import { PIXEL8_MESH } from '@/lib/phone-swap/pixel8Assets'

/** Site accent — keep in sync with `--color-accent` in globals.css */
export const PHONE_SWAP_ACCENT = '#DE3E18'

export const PHONE_SWAP_ACCENT_COLOR = new THREE.Color(PHONE_SWAP_ACCENT)

const DISPLAY_MESH_NAMES = new Set<string>([
  IPHONE16_MESH.display,
  PIXEL8_MESH.display,
  ANDROID_MESH.display,
  'GP9p_display',
])

const HIDDEN_GLASS_NAMES = new Set<string>([
  IPHONE16_MESH.glass,
  PIXEL8_MESH.glass,
  ANDROID_MESH.glass,
])

export function isPhoneDisplayMesh(mesh: THREE.Mesh): boolean {
  if (DISPLAY_MESH_NAMES.has(mesh.name)) return true
  const name = mesh.name.toLowerCase()
  return (
    (name.includes('display') || name === 'screensg1') &&
    !name.includes('glass')
  )
}

/** Whole phone gets hover — only skip hidden glass shells. */
export function isPhoneHoverMesh(
  mesh: THREE.Mesh,
  material: THREE.Material,
): boolean {
  if (HIDDEN_GLASS_NAMES.has(mesh.name)) return false
  if (material instanceof THREE.MeshPhysicalMaterial) return false
  if (material instanceof THREE.ShaderMaterial && isPhoneDisplayMesh(mesh)) {
    return false
  }
  if (
    material instanceof THREE.MeshStandardMaterial ||
    material instanceof THREE.MeshBasicMaterial
  ) {
    return true
  }
  return false
}

export const PHONE_HOVER = {
  colorTint: 0.52,
  emissiveIntensity: 0.62,
  hoverLerp: 0.38,
} as const

export function applyModelHoverGlow(
  material: THREE.MeshStandardMaterial,
  base: { emissive: THREE.Color; emissiveIntensity: number },
  hover: number,
) {
  const t = hover * PHONE_HOVER.emissiveIntensity
  material.emissive.copy(PHONE_SWAP_ACCENT_COLOR).multiplyScalar(t)
  material.emissiveIntensity = base.emissiveIntensity + t
}

type ColorBaseline = { color: THREE.Color; opacity: number }

export function baselineColorMaterial(
  mat: THREE.MeshStandardMaterial | THREE.MeshBasicMaterial | THREE.MeshPhysicalMaterial,
): ColorBaseline {
  if (!mat.userData.phoneHoverBaseline) {
    mat.userData.phoneHoverBaseline = {
      color: mat.color.clone(),
      opacity: mat.opacity,
    } satisfies ColorBaseline
  }
  return mat.userData.phoneHoverBaseline as ColorBaseline
}

export function restoreColorMaterial(
  mat: THREE.MeshStandardMaterial | THREE.MeshBasicMaterial | THREE.MeshPhysicalMaterial,
  base: ColorBaseline,
) {
  mat.color.copy(base.color)
  mat.opacity = base.opacity
}

export function applyAccentTint(
  mat: THREE.MeshStandardMaterial | THREE.MeshBasicMaterial | THREE.MeshPhysicalMaterial,
  base: ColorBaseline,
  hover: number,
) {
  mat.color.copy(base.color).lerp(PHONE_SWAP_ACCENT_COLOR, hover * PHONE_HOVER.colorTint)
}
