import * as THREE from 'three'
import {
  isPhoneDisplayMesh,
  applyModelHoverGlow,
  isPhoneHoverMesh,
  PHONE_HOVER,
  PHONE_SWAP_ACCENT_COLOR,
} from '@/lib/phone-swap/phoneAccentHover'
import type { PhoneSwapSnapshot } from '@/lib/phone-swap/phoneSwapLayout'

const MIN_SCALE = 0.72
const MAX_SCALE = 1

type StandardBaseline = {
  color: THREE.Color
  roughness: number
  metalness: number
  envMapIntensity: number
  opacity: number
  transparent: boolean
  emissive: THREE.Color
  emissiveIntensity: number
  normalScaleX: number
  normalScaleY: number
}

export type PhoneFocusOptions = {
  /** 0–1 orange hover on the back phone. */
  glowStrength?: number
}

function clamp01(t: number): number {
  return Math.max(0, Math.min(1, t))
}

/** 0 = back / soft, 1 = front / sharp — derived from scale during swap. */
export function focusFromScale(scale: number): number {
  return clamp01((scale - MIN_SCALE) / (MAX_SCALE - MIN_SCALE))
}

export function focusForSnapshot(
  snapshot: PhoneSwapSnapshot,
  device: 'android' | 'iphone',
): number {
  return focusFromScale(snapshot[device].scale)
}

function standardBaseline(mat: THREE.MeshStandardMaterial): StandardBaseline {
  if (!mat.userData.phoneFocusBaseline) {
    mat.userData.phoneFocusBaseline = {
      color: mat.color.clone(),
      roughness: mat.roughness,
      metalness: mat.metalness,
      envMapIntensity: mat.envMapIntensity ?? 1,
      opacity: mat.opacity,
      transparent: mat.transparent,
      emissive: mat.emissive.clone(),
      emissiveIntensity: mat.emissiveIntensity ?? 0,
      normalScaleX: mat.normalScale?.x ?? 1,
      normalScaleY: mat.normalScale?.y ?? 1,
    } satisfies StandardBaseline
  }
  return mat.userData.phoneFocusBaseline as StandardBaseline
}

const lastFocusByRoot = new WeakMap<THREE.Object3D, { glow: number }>()

export function resetFocusVisuals(root: THREE.Object3D | null) {
  if (!root) return
  lastFocusByRoot.delete(root)
}

function restoreStandard(mat: THREE.MeshStandardMaterial, base: StandardBaseline) {
  mat.color.copy(base.color)
  mat.roughness = base.roughness
  mat.metalness = base.metalness
  mat.envMapIntensity = base.envMapIntensity
  mat.opacity = base.opacity
  mat.transparent = base.transparent
  mat.emissive.copy(base.emissive)
  mat.emissiveIntensity = base.emissiveIntensity
  if (mat.normalScale) {
    mat.normalScale.set(base.normalScaleX, base.normalScaleY)
  }
}

type BasicBaseline = { color: THREE.Color; opacity: number; transparent: boolean }

function basicBaseline(material: THREE.MeshBasicMaterial): BasicBaseline {
  if (!material.userData.phoneFocusBasicBaseline) {
    material.userData.phoneFocusBasicBaseline = {
      color: material.color.clone(),
      opacity: material.opacity,
      transparent: material.transparent,
    } satisfies BasicBaseline
  }
  return material.userData.phoneFocusBasicBaseline as BasicBaseline
}

function restoreBasic(material: THREE.MeshBasicMaterial, base: BasicBaseline) {
  material.color.copy(base.color)
  material.opacity = base.opacity
  material.transparent = base.transparent
}

function applyHoverAccent(
  material: THREE.MeshStandardMaterial,
  base: StandardBaseline,
  hover: number,
) {
  material.color.lerp(
    PHONE_SWAP_ACCENT_COLOR,
    hover * PHONE_HOVER.colorTint,
  )
  applyModelHoverGlow(material, base, hover)
}

export function applyFocusToPhoneRoot(
  root: THREE.Object3D | null,
  _focus: number,
  force = false,
  options?: PhoneFocusOptions,
) {
  if (!root) return

  const hover = clamp01(options?.glowStrength ?? 0)
  const prev = lastFocusByRoot.get(root)
  if (!force && prev !== undefined && Math.abs(prev.glow - hover) < 0.02) {
    return
  }
  lastFocusByRoot.set(root, { glow: hover })

  root.traverse((child) => {
    if (!(child instanceof THREE.Mesh)) return
    if (isPhoneDisplayMesh(child)) return
    const materials = Array.isArray(child.material) ? child.material : [child.material]

    for (const material of materials) {
      const showHover = hover > 0.01 && isPhoneHoverMesh(child, material)

      if (material instanceof THREE.MeshStandardMaterial) {
        const base = standardBaseline(material)

        if (!showHover) {
          restoreStandard(material, base)
          continue
        }

        restoreStandard(material, base)
        applyHoverAccent(material, base, hover)
        continue
      }

      if (material instanceof THREE.MeshBasicMaterial) {
        const base = basicBaseline(material)

        if (!showHover) {
          restoreBasic(material, base)
          continue
        }

        restoreBasic(material, base)
        material.color.lerp(
          PHONE_SWAP_ACCENT_COLOR,
          hover * PHONE_HOVER.colorTint,
        )
      }
    }
  })
}
