import * as THREE from 'three'
import {
  applyAccentTint,
  applyModelHoverGlow,
  baselineColorMaterial,
  isPhoneHoverMesh,
  PHONE_HOVER,
  PHONE_SWAP_ACCENT_COLOR,
  restoreColorMaterial,
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
  /** 0–1 hover emphasis on the back phone. */
  glowStrength?: number
}

function clamp01(t: number): number {
  return Math.max(0, Math.min(1, t))
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t
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

const lastFocusByRoot = new WeakMap<
  THREE.Object3D,
  { focus: number; glow: number }
>()

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

function applyHoverToColorMaterial(
  material:
    | THREE.MeshStandardMaterial
    | THREE.MeshBasicMaterial
    | THREE.MeshPhysicalMaterial,
  hover: number,
) {
  const base = baselineColorMaterial(material)
  if (hover <= 0.001) {
    restoreColorMaterial(material, base)
    return
  }
  applyAccentTint(material, base, hover)
}

export function applyFocusToPhoneRoot(
  root: THREE.Object3D | null,
  focus: number,
  force = false,
  options?: PhoneFocusOptions,
) {
  if (!root) return

  const f = clamp01(focus)
  const hover = clamp01(options?.glowStrength ?? 0)
  const prev = lastFocusByRoot.get(root)
  if (
    !force &&
    prev !== undefined &&
    Math.abs(prev.focus - f) < 0.002 &&
    Math.abs(prev.glow - hover) < 0.02
  ) {
    return
  }
  lastFocusByRoot.set(root, { focus: f, glow: hover })

  const defocus = (1 - f) * (1 - hover * PHONE_HOVER.defocusEase)

  root.traverse((child) => {
    if (!(child instanceof THREE.Mesh)) return
    const materials = Array.isArray(child.material) ? child.material : [child.material]

    for (const material of materials) {
      const modelHover = hover > 0.01 && isPhoneHoverMesh(child, material)

      if (material instanceof THREE.MeshStandardMaterial) {
        const base = standardBaseline(material)

        if (defocus <= 0.001 && hover <= 0.001) {
          restoreStandard(material, base)
          continue
        }

        material.color.copy(base.color).multiplyScalar(lerp(1, 0.9, defocus))
        material.roughness = lerp(
          base.roughness,
          Math.min(1, base.roughness + 0.55),
          defocus,
        )
        material.metalness = lerp(base.metalness, base.metalness * 0.4, defocus)
        material.envMapIntensity = lerp(
          base.envMapIntensity,
          base.envMapIntensity * 0.35,
          defocus,
        )
        material.opacity = lerp(base.opacity, Math.max(0.82, base.opacity * 0.92), defocus)
        material.transparent = base.transparent || defocus > 0.02

        if (material.normalScale) {
          const normalSoft = lerp(1, 0.15, defocus)
          material.normalScale.set(
            base.normalScaleX * normalSoft,
            base.normalScaleY * normalSoft,
          )
        }

        if (material.map && defocus > 0.05) {
          material.map.anisotropy = Math.max(
            1,
            Math.round(lerp(8, 1, defocus)),
          )
          material.map.needsUpdate = true
        }

        if (modelHover) {
          material.color.lerp(
            PHONE_SWAP_ACCENT_COLOR,
            hover * PHONE_HOVER.colorTint,
          )
          applyModelHoverGlow(material, base, hover)
        } else {
          material.emissive.copy(base.emissive)
          material.emissiveIntensity = base.emissiveIntensity
        }
        continue
      }

      if (material instanceof THREE.MeshBasicMaterial) {
        if (!modelHover) {
          if (hover <= 0.001) {
            const base = baselineColorMaterial(material)
            restoreColorMaterial(material, base)
          }
          continue
        }
        applyHoverToColorMaterial(material, hover)
      }
    }
  })
}
