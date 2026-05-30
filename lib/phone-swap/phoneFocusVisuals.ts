import * as THREE from 'three'
import type { PhoneSwapSnapshot } from '@/lib/phone-swap/phoneSwapLayout'

const MIN_SCALE = 0.72
const MAX_SCALE = 1

type MaterialBaseline = {
  color: THREE.Color
  roughness: number
  metalness: number
  envMapIntensity: number
  opacity: number
  transparent: boolean
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

function baselineForMaterial(mat: THREE.MeshStandardMaterial): MaterialBaseline {
  if (!mat.userData.phoneFocusBaseline) {
    mat.userData.phoneFocusBaseline = {
      color: mat.color.clone(),
      roughness: mat.roughness,
      metalness: mat.metalness,
      envMapIntensity: mat.envMapIntensity ?? 1,
      opacity: mat.opacity,
      transparent: mat.transparent,
    } satisfies MaterialBaseline
  }
  return mat.userData.phoneFocusBaseline as MaterialBaseline
}

const lastFocusByRoot = new WeakMap<THREE.Object3D, number>()

export function resetFocusVisuals(root: THREE.Object3D | null) {
  if (!root) return
  lastFocusByRoot.delete(root)
}

export function applyFocusToPhoneRoot(root: THREE.Object3D | null, focus: number, force = false) {
  if (!root) return

  const f = clamp01(focus)
  const prev = lastFocusByRoot.get(root)
  if (!force && prev !== undefined && Math.abs(prev - f) < 0.002) return
  lastFocusByRoot.set(root, f)

  const defocus = 1 - f

  root.traverse((child) => {
    if (!(child instanceof THREE.Mesh)) return

    const materials = Array.isArray(child.material) ? child.material : [child.material]
    for (const material of materials) {
      if (!(material instanceof THREE.MeshStandardMaterial)) continue

      const base = baselineForMaterial(material)

      if (defocus <= 0.001) {
        material.color.copy(base.color)
        material.roughness = base.roughness
        material.metalness = base.metalness
        material.envMapIntensity = base.envMapIntensity
        material.opacity = base.opacity
        material.transparent = base.transparent
        continue
      }

      material.color.copy(base.color).multiplyScalar(lerp(1, 0.88, defocus))
      material.roughness = lerp(base.roughness, Math.min(1, base.roughness + 0.48), defocus)
      material.metalness = lerp(base.metalness, base.metalness * 0.45, defocus)
      material.envMapIntensity = lerp(base.envMapIntensity, base.envMapIntensity * 0.45, defocus)
      material.opacity = lerp(base.opacity, Math.max(0.7, base.opacity * 0.86), defocus)
      material.transparent = base.transparent || defocus > 0.02
    }
  })
}
