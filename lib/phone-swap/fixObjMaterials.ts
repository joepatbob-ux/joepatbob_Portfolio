import * as THREE from 'three'

/** Keep MTL materials; only fix transparency that makes meshes invisible in WebGL. */
export function fixObjMaterials(root: THREE.Object3D) {
  root.traverse((child) => {
    if (!(child instanceof THREE.Mesh)) return

    const mats = Array.isArray(child.material)
      ? child.material
      : [child.material]

    for (const mat of mats) {
      if (!mat) continue
      mat.transparent = false
      mat.opacity = 1
      mat.depthWrite = true
      mat.visible = true
      if ('color' in mat && mat.color instanceof THREE.Color) {
        const c = mat.color
        if (c.r + c.g + c.b < 0.05) {
          mat.color = new THREE.Color(0xcccccc)
        }
      }
      mat.needsUpdate = true
    }
  })
}
