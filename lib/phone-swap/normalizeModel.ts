import * as THREE from 'three'

export type NormalizedModelInfo = {
  radius: number
  maxDim: number
}

/** Scale to targetMax, then re-center so the bounding box sits on the origin. */
export function normalizeModel(
  root: THREE.Object3D,
  targetMax = 2.2,
): NormalizedModelInfo {
  root.updateMatrixWorld(true)

  const box = new THREE.Box3().setFromObject(root)
  const size = box.getSize(new THREE.Vector3())
  const maxDim = Math.max(size.x, size.y, size.z) || 1
  const scale = targetMax / maxDim

  root.scale.multiplyScalar(scale)
  root.updateMatrixWorld(true)

  const centered = new THREE.Box3().setFromObject(root)
  const center = centered.getCenter(new THREE.Vector3())
  root.position.sub(center)
  root.updateMatrixWorld(true)

  const finalBox = new THREE.Box3().setFromObject(root)
  const sphere = finalBox.getBoundingSphere(new THREE.Sphere())

  return {
    radius: sphere.radius,
    maxDim: Math.max(
      finalBox.getSize(new THREE.Vector3()).x,
      finalBox.getSize(new THREE.Vector3()).y,
      finalBox.getSize(new THREE.Vector3()).z,
    ),
  }
}
