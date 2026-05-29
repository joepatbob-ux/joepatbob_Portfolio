import * as THREE from 'three'

/**
 * Adobe-exported MTL often sets map_d + transparent, which can render phones invisible.
 * Rebuild as simple lit materials while keeping diffuse maps.
 */
export function sanitizeObjMaterials(root: THREE.Object3D) {
  root.traverse((child) => {
    if (!(child instanceof THREE.Mesh)) return

    const toStandard = (mat: THREE.Material): THREE.MeshStandardMaterial => {
      const phong = mat as THREE.MeshPhongMaterial
      const map =
        phong.map instanceof THREE.Texture
          ? phong.map
          : 'map' in mat && mat.map instanceof THREE.Texture
            ? mat.map
            : null
      const color =
        phong.color instanceof THREE.Color
          ? phong.color.clone()
          : new THREE.Color(0xdddddd)

      const next = new THREE.MeshStandardMaterial({
        map,
        color: map ? new THREE.Color(0xffffff) : color,
        metalness: 0.15,
        roughness: 0.42,
        side: THREE.DoubleSide,
        transparent: false,
        opacity: 1,
        depthWrite: true,
      })
      mat.dispose()
      return next
    }

    if (Array.isArray(child.material)) {
      child.material = child.material.map(toStandard)
    } else {
      child.material = toStandard(child.material)
    }
  })
}
