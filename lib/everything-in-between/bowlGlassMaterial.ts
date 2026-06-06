import * as THREE from 'three'

/** Adobe Stock bundle — `/public/models/glass-bowl-a/glass_bowl_a/` */
export const BOWL_TEXTURE_ASSETS = {
  baseColor: '/models/glass-bowl-a/glass_bowl_a/glass_bowl_a_Mat_baseColor.png',
  normal: '/models/glass-bowl-a/glass_bowl_a/glass_bowl_a_Mat_normal.png',
  roughness: '/models/glass-bowl-a/glass_bowl_a/glass_bowl_a_Mat_roughness.png',
  translucence: '/models/glass-bowl-a/glass_bowl_a/glass_bowl_a_Mat_translucence.png',
  opacity: '/models/glass-bowl-a/glass_bowl_a/glass_bowl_a_Mat_opacity.png',
  metallic: '/models/glass-bowl-a/glass_bowl_a/glass_bowl_a_Mat_metallic.png',
} as const

/**
 * Bowl glass rendering modes.
 *
 * | Mode               | Maps | Best for |
 * |--------------------|------|----------|
 * | `procedural-clear` | none | Clearest glass; paper reads through (default) |
 * | `procedural-soft`  | none | Slightly frosted / softer highlights |
 * | `authored-pbr`     | Adobe baseColor, normal, roughness, translucence | Match stock asset look |
 */
export type BowlGlassMode = 'procedural-clear' | 'procedural-soft' | 'authored-pbr'

/** Active mode — change here to swap bowl look. */
export const BOWL_GLASS_MODE: BowlGlassMode = 'procedural-clear'

export type BowlGlassPreset = {
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
}

const PRESETS: Record<BowlGlassMode, { light: BowlGlassPreset; dark: BowlGlassPreset }> = {
  'procedural-clear': {
    light: {
      color: '#ffffff',
      transmission: 1,
      roughness: 0.015,
      metalness: 0,
      ior: 1.52,
      thickness: 0.12,
      envMapIntensity: 0.55,
      clearcoat: 0.08,
      clearcoatRoughness: 0.03,
      attenuationColor: '#f8fafc',
      attenuationDistance: 4.5,
    },
    dark: {
      color: '#f0f4f8',
      transmission: 1,
      roughness: 0.012,
      metalness: 0,
      ior: 1.52,
      thickness: 0.1,
      envMapIntensity: 0.42,
      clearcoat: 0.06,
      clearcoatRoughness: 0.03,
      attenuationColor: '#e8eef4',
      attenuationDistance: 5,
    },
  },
  'procedural-soft': {
    light: {
      color: '#eef3f8',
      transmission: 0.96,
      roughness: 0.08,
      metalness: 0,
      ior: 1.48,
      thickness: 0.28,
      envMapIntensity: 0.85,
      clearcoat: 0.22,
      clearcoatRoughness: 0.08,
      attenuationColor: '#e8edf2',
      attenuationDistance: 2.8,
    },
    dark: {
      color: '#c8d4e0',
      transmission: 0.97,
      roughness: 0.06,
      metalness: 0,
      ior: 1.48,
      thickness: 0.24,
      envMapIntensity: 0.6,
      clearcoat: 0.28,
      clearcoatRoughness: 0.07,
      attenuationColor: '#b8c8d8',
      attenuationDistance: 3.2,
    },
  },
  'authored-pbr': {
    light: {
      color: '#ffffff',
      transmission: 0.94,
      roughness: 0.35,
      metalness: 0,
      ior: 1.5,
      thickness: 0.35,
      envMapIntensity: 0.7,
      clearcoat: 0.15,
      clearcoatRoughness: 0.12,
      attenuationColor: '#ffffff',
      attenuationDistance: 3,
    },
    dark: {
      color: '#e8eef4',
      transmission: 0.95,
      roughness: 0.32,
      metalness: 0,
      ior: 1.5,
      thickness: 0.3,
      envMapIntensity: 0.55,
      clearcoat: 0.12,
      clearcoatRoughness: 0.1,
      attenuationColor: '#dce4ec',
      attenuationDistance: 3.5,
    },
  },
}

export function getBowlGlassPreset(
  mode: BowlGlassMode,
  dark: boolean,
): BowlGlassPreset {
  return PRESETS[mode][dark ? 'dark' : 'light']
}

export function createBowlGlassMaterial(
  dark: boolean,
  mode: BowlGlassMode = BOWL_GLASS_MODE,
): THREE.MeshPhysicalMaterial {
  const p = getBowlGlassPreset(mode, dark)
  return new THREE.MeshPhysicalMaterial({
    color: p.color,
    transmission: p.transmission,
    transparent: true,
    opacity: 1,
    roughness: p.roughness,
    metalness: p.metalness,
    ior: p.ior,
    thickness: p.thickness,
    envMapIntensity: p.envMapIntensity,
    clearcoat: p.clearcoat,
    clearcoatRoughness: p.clearcoatRoughness,
    attenuationColor: new THREE.Color(p.attenuationColor),
    attenuationDistance: p.attenuationDistance,
    side: THREE.DoubleSide,
    depthWrite: false,
  })
}

/** Apply authored PBR maps (call after textures load). */
export function applyBowlAuthoredMaps(
  material: THREE.MeshPhysicalMaterial,
  maps: {
    map?: THREE.Texture | null
    normalMap?: THREE.Texture | null
    roughnessMap?: THREE.Texture | null
    alphaMap?: THREE.Texture | null
  },
) {
  if (maps.map) {
    material.map = maps.map
    maps.map.colorSpace = THREE.SRGBColorSpace
  }
  if (maps.normalMap) {
    material.normalMap = maps.normalMap
    material.normalScale.set(0.35, 0.35)
  }
  if (maps.roughnessMap) {
    material.roughnessMap = maps.roughnessMap
    material.roughness = 1
  }
  if (maps.alphaMap) {
    material.alphaMap = maps.alphaMap
    material.transparent = true
  }
  material.needsUpdate = true
}

/** Human-readable option list for tuning / debug panels. */
export const BOWL_MATERIAL_OPTIONS = [
  {
    id: 'procedural-clear',
    label: 'Procedural — clear (default)',
    textures: 'None — pure MeshPhysicalMaterial glass',
    notes: 'Highest transmission, lowest roughness. Best for seeing the paper pile.',
  },
  {
    id: 'procedural-soft',
    label: 'Procedural — soft frost',
    textures: 'None — slightly higher roughness + clearcoat',
    notes: 'Gentler highlights; still transparent but less “museum case”.',
  },
  {
    id: 'authored-pbr',
    label: 'Authored PBR (Adobe Stock)',
    textures: Object.values(BOWL_TEXTURE_ASSETS).join(', '),
    notes: 'Uses baseColor, normal, roughness, translucence from the OBJ bundle.',
  },
] as const

export const BOWL_PHYSICAL_PARAMS = [
  'transmission — how much light passes through (0–1)',
  'roughness — surface micro-roughness; lower = clearer',
  'ior — index of refraction (glass ≈ 1.5)',
  'thickness — volume tint depth; lower = less green/milk haze',
  'attenuationColor / attenuationDistance — subtle volume absorption',
  'clearcoat / clearcoatRoughness — specular shell on top',
  'envMapIntensity — reflection strength from Environment preset',
  'color — base tint multiplied with transmission',
] as const
