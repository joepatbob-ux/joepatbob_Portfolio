import * as THREE from 'three'

/** C4D / Max exports are often left-handed on X — mirror, then rebuild normals. */
export function mirrorModelX(root: THREE.Object3D) {
  root.scale.x *= -1
  root.updateMatrixWorld(true)
  root.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      child.geometry.computeVertexNormals()
    }
  })
}
