import * as THREE from 'three'
import {
  PIXEL8_ACCENT_SLOTS,
  PIXEL8_BLACK_SLOTS,
  PIXEL8_BODY_TEXTURE_SLOTS,
  PIXEL8_GOLD_SLOTS,
  PIXEL8_LOGO_SLOTS,
  PIXEL8_MESH,
  PIXEL8_SPEAKER_GRILLE_SLOTS,
  PIXEL8_SPEAKER_SLOTS,
} from '@/lib/phone-swap/pixel8Assets'
import {
  IPHONE16_MESH,
  IPHONE16_RING_OBJECTS,
  IPHONE16_SIDE_OBJECTS,
} from '@/lib/phone-swap/iphone16Assets'
import { meshMaterialSlot } from '@/lib/phone-swap/mergeMeshesByMaterial'

export type PhoneMaterialRole =
  | 'body'
  | 'black'
  | 'gold'
  | 'accent'
  | 'logo'
  | 'speaker'
  | 'grille'
  | 'display'
  | 'glass'
  | 'side'
  | 'ring'
  | 'other'

export type PhoneMaterialDevice = 'android' | 'iphone'

export type PhoneMaterialSlotInfo = {
  /** Stable key — mesh name after consolidate (material slot). */
  id: string
  meshName: string
  slotName: string
  role: PhoneMaterialRole
  materialType: string
  materialName: string
  visible: boolean
  color: string
  roughness: number | null
  metalness: number | null
  envMapIntensity: number | null
  opacity: number
  transparent: boolean
  hasMap: boolean
  hasAlphaMap: boolean
}

export const PHONE_MATERIAL_ROLE_LABEL: Record<PhoneMaterialRole, string> = {
  body: 'Body shell',
  black: 'Camera / black',
  gold: 'Gold trim',
  accent: 'Accent',
  logo: 'Logo',
  speaker: 'Speaker',
  grille: 'Grille',
  display: 'Screen PNG',
  glass: 'Front bezel',
  side: 'Side / buttons',
  ring: 'Camera ring',
  other: 'Other',
}

export const PHONE_MATERIAL_DEVICE_LABEL: Record<PhoneMaterialDevice, string> = {
  android: 'Android (Pixel 8 Pro)',
  iphone: 'iPhone (16 Pro)',
}

export function classifyPixel8Slot(slotName: string): PhoneMaterialRole {
  if (slotName === PIXEL8_MESH.display || slotName === PIXEL8_MESH.displayBacking) {
    return 'display'
  }
  if (slotName === PIXEL8_MESH.glass) return 'glass'
  if (PIXEL8_BODY_TEXTURE_SLOTS.has(slotName)) return 'body'
  if (PIXEL8_BLACK_SLOTS.has(slotName)) return 'black'
  if (PIXEL8_GOLD_SLOTS.has(slotName)) return 'gold'
  if (PIXEL8_ACCENT_SLOTS.has(slotName)) return 'accent'
  if (PIXEL8_LOGO_SLOTS.has(slotName)) return 'logo'
  if (PIXEL8_SPEAKER_SLOTS.has(slotName)) return 'speaker'
  if (PIXEL8_SPEAKER_GRILLE_SLOTS.has(slotName)) return 'grille'
  return 'other'
}

export function classifyIPhoneSlot(
  meshName: string,
  materialName: string,
): PhoneMaterialRole {
  if (meshName === IPHONE16_MESH.display) return 'display'
  if (meshName === IPHONE16_MESH.glass) return 'glass'
  if (IPHONE16_SIDE_OBJECTS.has(meshName)) return 'side'
  if (IPHONE16_RING_OBJECTS.has(meshName)) return 'ring'
  if (meshName === IPHONE16_MESH.body) return 'body'

  switch (materialName) {
    case 'TITANIUM Rough':
    case 'TITANIUM Satin':
    case 'STEEL Satin':
    case 'GL_BACK Polished':
    case 'GL_BACK Rough':
      return 'body'
    case 'PL_GLOSSY Black':
    case 'PL_SATIN Black':
    case 'PL_ANTENNAS':
    case 'LENS':
      return 'black'
    case 'GOLD Connectors':
      return 'gold'
    case 'GL_LOGO':
      return 'logo'
    case 'MESH':
    case 'MESH Bottom':
      return 'speaker'
    case 'GLASS':
    case 'GLASS Flash':
      return 'glass'
    case 'SCREEN':
      return 'display'
    default:
      return 'other'
  }
}

export function materialSlotId(
  mesh: THREE.Mesh,
  device: PhoneMaterialDevice,
): string {
  if (device === 'iphone') return mesh.name
  if (mesh.name.endsWith('SG1')) return mesh.name
  return meshMaterialSlot(mesh)
}

function materialTypeLabel(material: THREE.Material): string {
  return material.type.replace('Material', '')
}

function readStandardProps(material: THREE.MeshStandardMaterial) {
  return {
    color: `#${material.color.getHexString()}`,
    roughness: material.roughness,
    metalness: material.metalness,
    envMapIntensity: material.envMapIntensity ?? 1,
    opacity: material.opacity,
    transparent: material.transparent,
    hasMap: !!material.map,
    hasAlphaMap: !!material.alphaMap,
  }
}

function readBasicProps(material: THREE.MeshBasicMaterial) {
  return {
    color: `#${material.color.getHexString()}`,
    roughness: null,
    metalness: null,
    envMapIntensity: null,
    opacity: material.opacity,
    transparent: material.transparent,
    hasMap: !!material.map,
    hasAlphaMap: false,
  }
}

function readMaterialProps(material: THREE.Material) {
  if (material instanceof THREE.MeshStandardMaterial) {
    return readStandardProps(material)
  }
  if (material instanceof THREE.MeshBasicMaterial) {
    return readBasicProps(material)
  }
  return {
    color: '#ffffff',
    roughness: null,
    metalness: null,
    envMapIntensity: null,
    opacity: 1,
    transparent: material.transparent ?? false,
    hasMap: false,
    hasAlphaMap: false,
  }
}

/** Inventory of material slots on a prepared phone scene root. */
export function inspectPhoneMaterials(
  root: THREE.Object3D | null,
  device: PhoneMaterialDevice,
): PhoneMaterialSlotInfo[] {
  if (!root) return []

  const rows: PhoneMaterialSlotInfo[] = []

  root.traverse((child) => {
    if (!(child instanceof THREE.Mesh)) return

    const slotName = materialSlotId(child, device)
    const material = Array.isArray(child.material)
      ? child.material[0]
      : child.material
    if (!material) return

    const props = readMaterialProps(material)
    const materialName = material.name || slotName
    const role =
      device === 'iphone'
        ? classifyIPhoneSlot(child.name, materialName)
        : classifyPixel8Slot(slotName)

    rows.push({
      id: slotName,
      meshName: child.name,
      slotName,
      role,
      materialType: materialTypeLabel(material),
      materialName,
      visible: child.visible,
      ...props,
    })
  })

  const roleOrder: PhoneMaterialRole[] = [
    'display',
    'body',
    'side',
    'ring',
    'black',
    'gold',
    'accent',
    'logo',
    'grille',
    'speaker',
    'glass',
    'other',
  ]

  return rows.sort((a, b) => {
    const rd = roleOrder.indexOf(a.role) - roleOrder.indexOf(b.role)
    if (rd !== 0) return rd
    return a.slotName.localeCompare(b.slotName)
  })
}
