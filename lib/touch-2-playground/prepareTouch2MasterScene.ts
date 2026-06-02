import * as THREE from 'three'
import { mtlPhongToStandard } from '@/lib/phone-swap/mtlPhongToStandard'
import { normalizeModel } from '@/lib/phone-swap/normalizeModel'

function upgradeMaterial(mat: THREE.Material): THREE.Material {
  if (mat instanceof THREE.MeshStandardMaterial) return mat
  return mtlPhongToStandard(mat, {
    name: mat.name || 'touch2',
    envMapIntensity: 0.45,
  })
}

function upgradeMeshMaterials(root: THREE.Object3D) {
  root.traverse((child) => {
    if (!(child instanceof THREE.Mesh)) return
    if (Array.isArray(child.material)) {
      child.material = child.material.map(upgradeMaterial)
    } else {
      child.material = upgradeMaterial(child.material)
    }
    child.frustumCulled = false
  })
}

/** Clone, center, scale, and upgrade KeyShot Phong MTL to Standard for R3F lighting. */
export function prepareTouch2MasterScene(raw: THREE.Object3D) {
  const scene = raw.clone(true)
  scene.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      child.geometry = child.geometry.clone()
    }
  })
  upgradeMeshMaterials(scene)
  const { radius } = normalizeModel(scene, 2.4)
  return { scene, fitRadius: radius }
}
