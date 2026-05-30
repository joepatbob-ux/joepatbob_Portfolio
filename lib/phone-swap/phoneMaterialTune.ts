import * as THREE from 'three'
import { isPhoneDisplayMesh } from '@/lib/phone-swap/phoneAccentHover'
import {
  materialSlotId,
  type PhoneMaterialDevice,
  type PhoneMaterialSlotInfo,
} from '@/lib/phone-swap/phoneMaterialInspect'

export type PhoneMaterialOverride = {
  color?: string
  roughness?: number
  metalness?: number
  envMapIntensity?: number
  opacity?: number
  visible?: boolean
}

export type PhoneMaterialTuneState = Record<string, PhoneMaterialOverride>

export type PhoneMaterialTunesByDevice = Record<
  PhoneMaterialDevice,
  PhoneMaterialTuneState
>

export const EMPTY_PHONE_MATERIAL_TUNES: PhoneMaterialTunesByDevice = {
  android: {},
  iphone: {},
}

type MaterialBaseline = {
  color: THREE.Color
  roughness: number
  metalness: number
  envMapIntensity: number
  opacity: number
  transparent: boolean
}

const materialBaseline = new WeakMap<THREE.Material, MaterialBaseline>()
const meshVisibleBaseline = new WeakMap<THREE.Mesh, boolean>()

function slotKeyForMesh(mesh: THREE.Mesh, device: PhoneMaterialDevice): string {
  return materialSlotId(mesh, device)
}

function captureBaseline(material: THREE.Material) {
  if (materialBaseline.has(material)) return
  if (material instanceof THREE.MeshStandardMaterial) {
    materialBaseline.set(material, {
      color: material.color.clone(),
      roughness: material.roughness,
      metalness: material.metalness,
      envMapIntensity: material.envMapIntensity ?? 1,
      opacity: material.opacity,
      transparent: material.transparent,
    })
    return
  }
  if (material instanceof THREE.MeshBasicMaterial) {
    materialBaseline.set(material, {
      color: material.color.clone(),
      roughness: 0,
      metalness: 0,
      envMapIntensity: 1,
      opacity: material.opacity,
      transparent: material.transparent,
    })
  }
}

function restoreMaterial(material: THREE.Material) {
  const base = materialBaseline.get(material)
  if (!base) return
  if (
    material instanceof THREE.MeshStandardMaterial ||
    material instanceof THREE.MeshBasicMaterial
  ) {
    material.color.copy(base.color)
    material.opacity = base.opacity
    material.transparent = base.transparent
  }
  if (material instanceof THREE.MeshStandardMaterial) {
    material.roughness = base.roughness
    material.metalness = base.metalness
    material.envMapIntensity = base.envMapIntensity
  }
}

function applyOverride(
  material: THREE.Material,
  override: PhoneMaterialOverride,
) {
  captureBaseline(material)

  if (override.color !== undefined) {
    if (
      material instanceof THREE.MeshStandardMaterial ||
      material instanceof THREE.MeshBasicMaterial
    ) {
      material.color.set(override.color)
    }
  }

  if (material instanceof THREE.MeshStandardMaterial) {
    if (override.roughness !== undefined) {
      material.roughness = override.roughness
    }
    if (override.metalness !== undefined) {
      material.metalness = override.metalness
    }
    if (override.envMapIntensity !== undefined) {
      material.envMapIntensity = override.envMapIntensity
    }
  }

  if (
    override.opacity !== undefined &&
    (material instanceof THREE.MeshStandardMaterial ||
      material instanceof THREE.MeshBasicMaterial)
  ) {
    material.opacity = override.opacity
    material.transparent = override.opacity < 0.999 || material.transparent
  }
}

export function applyPhoneMaterialTunes(
  root: THREE.Object3D | null,
  tunes: PhoneMaterialTuneState,
  device: PhoneMaterialDevice,
) {
  if (!root) return

  const activeIds = new Set(Object.keys(tunes))

  root.traverse((child) => {
    if (!(child instanceof THREE.Mesh)) return

    const id = slotKeyForMesh(child, device)
    if (!meshVisibleBaseline.has(child)) {
      meshVisibleBaseline.set(child, child.visible)
    }

    const override = tunes[id]
    const materials = Array.isArray(child.material) ? child.material : [child.material]

    if (!override) {
      if (isPhoneDisplayMesh(child)) return
      child.visible = meshVisibleBaseline.get(child) ?? true
      for (const material of materials) {
        restoreMaterial(material)
      }
      return
    }

    if (override.visible !== undefined) {
      child.visible = override.visible
    } else {
      child.visible = meshVisibleBaseline.get(child) ?? true
    }

    for (const material of materials) {
      applyOverride(material, override)
    }
  })

  // Restore slots removed from tune state
  if (activeIds.size === 0) {
    root.traverse((child) => {
      if (!(child instanceof THREE.Mesh)) return
      child.visible = meshVisibleBaseline.get(child) ?? true
      const materials = Array.isArray(child.material) ? child.material : [child.material]
      for (const material of materials) {
        restoreMaterial(material)
      }
    })
  }
}

export function formatMaterialTunesTs(
  tunes: PhoneMaterialTuneState,
  inventory: PhoneMaterialSlotInfo[],
  device: PhoneMaterialDevice,
): string {
  const modelLabel =
    device === 'iphone' ? 'iPhone 16 Pro' : 'Pixel 8 Pro'
  const constName =
    device === 'iphone' ? 'IPHONE16_MATERIAL_TUNES' : 'PIXEL8_MATERIAL_TUNES'
  const bakeHint =
    device === 'iphone'
      ? 'prepareIPhone16Scene.ts'
      : 'applyPixel8MtlMaterials.ts'

  const lines = [
    `/** Dev material overrides — ${modelLabel} */`,
    `// Bake into ${bakeHint}`,
    `export const ${constName} = {`,
  ]
  for (const slot of inventory) {
    const o = tunes[slot.id]
    if (!o || Object.keys(o).length === 0) continue
    lines.push(`  '${slot.id}': ${JSON.stringify(o, null, 2).replace(/\n/g, '\n  ')},`)
  }
  lines.push('} as const')
  lines.push('')
  lines.push('// Roles:', ...inventory.map((s) => `// ${s.id} — ${s.role} (${s.materialType})`))
  return lines.join('\n')
}
