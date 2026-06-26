import { PHONE_SWAP_ACCENT_COLOR } from '@/lib/phone-swap/phoneAccentHover'
import * as THREE from 'three'

/** Solid accent crumpled paper — geometry carries crinkle; no slip PBR maps. */
export function applyPilePaperTint(material: THREE.MeshStandardMaterial) {
  material.map = null
  material.normalMap = null
  material.roughnessMap = null
  material.aoMap = null
  material.color.copy(PHONE_SWAP_ACCENT_COLOR)
  material.emissive.set('#000000')
  material.emissiveIntensity = 0
  material.roughness = 0.96
  material.metalness = 0
  material.transparent = false
  material.opacity = 1
  material.depthWrite = true
  material.needsUpdate = true
}
