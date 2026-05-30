import * as THREE from 'three'
import {
  PIXEL9_COLOR_VARIANT,
  PIXEL9_MESH,
  getPixel9Slot,
  pixel9Palette,
} from '@/lib/phone-swap/pixel9Assets'

const DEFAULT_SPEC = {
  color: 0x5a5a62,
  metalness: 0.25,
  roughness: 0.48,
  envMapIntensity: 1,
}

function slotSpec(slotName: string) {
  return getPixel9Slot(PIXEL9_COLOR_VARIANT)[slotName] ?? DEFAULT_SPEC
}

function buildStandardMaterial(slotName: string): THREE.MeshStandardMaterial {
  const spec = slotSpec(slotName)
  return new THREE.MeshStandardMaterial({
    name: slotName,
    color: spec.color,
    metalness: spec.metalness,
    roughness: spec.roughness,
    envMapIntensity: spec.envMapIntensity ?? 1,
    side: THREE.FrontSide,
  })
}

/** Dark glass panel until Android.png is applied on the merged display mesh only. */
export function applyPixel9DisplayStandIn(root: THREE.Object3D): number {
  let count = 0
  root.traverse((child) => {
    if (!(child instanceof THREE.Mesh) || child.name !== PIXEL9_MESH.display) {
      return
    }
    child.material = new THREE.MeshStandardMaterial({
      name: PIXEL9_MESH.display,
      color: pixel9Palette().display,
      metalness: 0,
      roughness: 0.88,
      emissive: 0x1a1a22,
      emissiveIntensity: 0.35,
      envMapIntensity: 0.5,
      side: THREE.FrontSide,
    })
    child.renderOrder = 10
    child.frustumCulled = false
    count += 1
  })
  return count
}

/** Active color variant ({@link PIXEL9_COLOR_VARIANT}) + Standard materials. */
export function applyPixel9MtlMaterials(root: THREE.Object3D): number {
  let count = 0
  root.traverse((child) => {
    if (!(child instanceof THREE.Mesh)) return
    if (child.name === PIXEL9_MESH.display) return

    child.material = buildStandardMaterial(child.name)
    child.frustumCulled = false
    count += 1
  })
  return count
}
