import type { BowlGlassMode } from '@/lib/everything-in-between/bowlGlassMaterial'
import * as THREE from 'three'

export const BOWL_GLASS_TUNE_STORAGE_KEY = 'bowl-glass-tune'
export const BOWL_GLASS_TUNE_CHANGE = 'bowl-glass-tune-change'

export type BowlGlassTuneSettings = {
  mode: BowlGlassMode
  /** Neutral glass — white color, no volume absorption tint. */
  noTint: boolean
  color: string
  transmission: number
  roughness: number
  metalness: number
  ior: number
  thickness: number
  envMapIntensity: number
  clearcoat: number
  clearcoatRoughness: number
  attenuationColor: string
  attenuationDistance: number
  opacity: number
  depthWrite: boolean
}

/** Starting values — tune in panel (right-click bowl or ?bowl-tune=1). */
export const DEFAULT_BOWL_GLASS_TUNE: BowlGlassTuneSettings = {
  mode: 'procedural-clear',
  noTint: true,
  color: '#ffffff',
  transmission: 0.99,
  roughness: 0.075,
  metalness: 0,
  ior: 1.5,
  thickness: 0.02,
  envMapIntensity: 0.14,
  clearcoat: 0,
  clearcoatRoughness: 0.12,
  attenuationColor: '#ffffff',
  attenuationDistance: 20,
  opacity: 1,
  depthWrite: false,
}

function clamp(n: number, min: number, max: number): number {
  if (!Number.isFinite(n)) return min
  return Math.max(min, Math.min(max, n))
}

export function clampBowlGlassTune(
  raw: Partial<BowlGlassTuneSettings>,
): BowlGlassTuneSettings {
  return {
    mode:
      raw.mode === 'procedural-soft' ||
      raw.mode === 'authored-pbr' ||
      raw.mode === 'procedural-clear'
        ? raw.mode
        : DEFAULT_BOWL_GLASS_TUNE.mode,
    noTint: raw.noTint ?? DEFAULT_BOWL_GLASS_TUNE.noTint,
    color: raw.color ?? DEFAULT_BOWL_GLASS_TUNE.color,
    transmission: clamp(raw.transmission ?? DEFAULT_BOWL_GLASS_TUNE.transmission, 0, 1),
    roughness: clamp(raw.roughness ?? DEFAULT_BOWL_GLASS_TUNE.roughness, 0, 1),
    metalness: clamp(raw.metalness ?? DEFAULT_BOWL_GLASS_TUNE.metalness, 0, 1),
    ior: clamp(raw.ior ?? DEFAULT_BOWL_GLASS_TUNE.ior, 1, 2.4),
    thickness: clamp(raw.thickness ?? DEFAULT_BOWL_GLASS_TUNE.thickness, 0, 2),
    envMapIntensity: clamp(
      raw.envMapIntensity ?? DEFAULT_BOWL_GLASS_TUNE.envMapIntensity,
      0,
      3,
    ),
    clearcoat: clamp(raw.clearcoat ?? DEFAULT_BOWL_GLASS_TUNE.clearcoat, 0, 1),
    clearcoatRoughness: clamp(
      raw.clearcoatRoughness ?? DEFAULT_BOWL_GLASS_TUNE.clearcoatRoughness,
      0,
      1,
    ),
    attenuationColor:
      raw.attenuationColor ?? DEFAULT_BOWL_GLASS_TUNE.attenuationColor,
    attenuationDistance: clamp(
      raw.attenuationDistance ?? DEFAULT_BOWL_GLASS_TUNE.attenuationDistance,
      0.01,
      40,
    ),
    opacity: clamp(raw.opacity ?? DEFAULT_BOWL_GLASS_TUNE.opacity, 0.02, 1),
    depthWrite: raw.depthWrite ?? DEFAULT_BOWL_GLASS_TUNE.depthWrite,
  }
}

export function readBowlGlassTune(): BowlGlassTuneSettings {
  if (typeof window === 'undefined') return DEFAULT_BOWL_GLASS_TUNE
  try {
    const raw = localStorage.getItem(BOWL_GLASS_TUNE_STORAGE_KEY)
    if (!raw) return DEFAULT_BOWL_GLASS_TUNE
    return clampBowlGlassTune(JSON.parse(raw) as Partial<BowlGlassTuneSettings>)
  } catch {
    return DEFAULT_BOWL_GLASS_TUNE
  }
}

export function saveBowlGlassTune(settings: BowlGlassTuneSettings): void {
  if (typeof window === 'undefined') return
  const next = clampBowlGlassTune(settings)
  localStorage.setItem(BOWL_GLASS_TUNE_STORAGE_KEY, JSON.stringify(next))
  window.dispatchEvent(new CustomEvent(BOWL_GLASS_TUNE_CHANGE, { detail: next }))
}

export function resolveBowlGlassTune(
  tune: BowlGlassTuneSettings,
): BowlGlassTuneSettings {
  const t = clampBowlGlassTune(tune)
  if (!t.noTint) return t
  return {
    ...t,
    color: '#ffffff',
    attenuationColor: '#ffffff',
    thickness: Math.min(t.thickness, 0.02),
    attenuationDistance: Math.max(t.attenuationDistance, 24),
  }
}

export function applyBowlGlassTune(
  material: THREE.MeshPhysicalMaterial,
  tune: BowlGlassTuneSettings,
): void {
  const t = resolveBowlGlassTune(tune)
  material.color.set(t.color)
  material.transmission = t.transmission
  material.transparent = t.transmission < 1 || t.opacity < 1
  material.opacity = t.opacity
  material.roughness = t.roughness
  material.metalness = t.metalness
  material.ior = t.ior
  material.thickness = t.thickness
  material.envMapIntensity = t.envMapIntensity
  material.clearcoat = t.clearcoat
  material.clearcoatRoughness = t.clearcoatRoughness
  material.attenuationColor.set(t.attenuationColor)
  material.attenuationDistance = t.attenuationDistance
  material.depthWrite = t.depthWrite
  material.side = THREE.DoubleSide
  material.needsUpdate = true
}

/** Stronger reflections + rim read when the canvas sits on a near-black page. */
export function applyDarkSurfaceGlassBoost(
  material: THREE.MeshPhysicalMaterial,
  boost: {
    envMapIntensityMul: number
    envMapIntensityAdd: number
    clearcoatMin: number
    clearcoatRoughnessMax: number
    colorLift: string
  },
): void {
  material.envMapIntensity = Math.min(
    3,
    material.envMapIntensity * boost.envMapIntensityMul + boost.envMapIntensityAdd,
  )
  material.clearcoat = Math.max(material.clearcoat, boost.clearcoatMin)
  material.clearcoatRoughness = Math.min(
    material.clearcoatRoughness,
    boost.clearcoatRoughnessMax,
  )
  if (material.color.getHex() === 0xffffff) {
    material.color.set(boost.colorLift)
  }
  material.needsUpdate = true
}

export function createTunedBowlGlassMaterial(
  tune: BowlGlassTuneSettings,
): THREE.MeshPhysicalMaterial {
  const material = new THREE.MeshPhysicalMaterial()
  applyBowlGlassTune(material, tune)
  return material
}

export function formatBowlGlassTuneTs(tune: BowlGlassTuneSettings): string {
  const t = clampBowlGlassTune(tune)
  return `export const BOWL_GLASS_TUNE = ${JSON.stringify(t, null, 2)} as const`
}

export function readBowlTuneEnabled(): boolean {
  if (typeof window === 'undefined') return false
  return new URLSearchParams(window.location.search).has('bowl-tune')
}
