import * as THREE from 'three'
import {
  ANDROID_MESH,
  applyAndroidScreen,
} from '@/lib/phone-swap/applyScreenTextures'
import { normalizeModel } from '@/lib/phone-swap/normalizeModel'

/** Deep-clone meshes so UV/material edits never touch the shared OBJ cache. */
function isolateMeshGeometries(root: THREE.Object3D) {
  root.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      child.geometry = child.geometry.clone()
    }
  })
}

function hideReflectionShell(root: THREE.Object3D) {
  const glass = root.getObjectByName(ANDROID_MESH.glass) as THREE.Mesh | undefined
  if (glass) {
    glass.visible = false
    glass.renderOrder = 0
  }
}

export function prepareAndroidScene(
  raw: THREE.Object3D,
  baseColor: THREE.Texture,
  screenTexture: THREE.Texture,
) {
  const clone = raw.clone(true)
  isolateMeshGeometries(clone)

  const { radius, maxDim } = normalizeModel(clone)

  let bodyMeshes = 0
  clone.traverse((child) => {
    if (!(child instanceof THREE.Mesh)) return
    if (
      child.name === ANDROID_MESH.display ||
      child.name === ANDROID_MESH.glass
    ) {
      return
    }
    if (child.name !== ANDROID_MESH.body) return

    bodyMeshes += 1
    child.material = new THREE.MeshStandardMaterial({
      map: baseColor,
      color: 0xffffff,
      metalness: 0.2,
      roughness: 0.45,
      side: THREE.DoubleSide,
    })
    child.frustumCulled = false
  })

  hideReflectionShell(clone)
  const screenMeshes = applyAndroidScreen(clone, screenTexture)

  return { scene: clone, fitRadius: radius }
}
