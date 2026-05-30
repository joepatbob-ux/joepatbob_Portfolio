import * as THREE from 'three'

/** Keep FBX diffuse colors/maps; upgrade Phong/Lambert to Standard for the scene lighting. */
export function upgradeFbxMaterialsToStandard(root: THREE.Object3D): number {
  let count = 0

  root.traverse((child) => {
    if (!(child instanceof THREE.Mesh)) return
    const source = child.material
    const mats = Array.isArray(source) ? source : [source]
    const upgraded = mats.map((mat) => convertMaterial(mat))
    child.material = Array.isArray(source) ? upgraded : upgraded[0]
    count += 1
  })

  return count
}

function convertMaterial(mat: THREE.Material): THREE.MeshStandardMaterial {
  if (mat instanceof THREE.MeshStandardMaterial) {
    mat.metalness = mat.metalness ?? 0.15
    mat.roughness = mat.roughness ?? 0.5
    return mat
  }

  if (mat instanceof THREE.MeshPhongMaterial) {
    return new THREE.MeshStandardMaterial({
      name: mat.name,
      color: mat.color.clone(),
      map: mat.map ?? null,
      alphaMap: mat.alphaMap ?? null,
      transparent: mat.transparent,
      opacity: mat.opacity,
      side: mat.side,
      metalness: 0.15,
      roughness: 0.5,
      envMapIntensity: 1,
    })
  }

  if (mat instanceof THREE.MeshLambertMaterial) {
    return new THREE.MeshStandardMaterial({
      name: mat.name,
      color: mat.color.clone(),
      map: mat.map ?? null,
      metalness: 0.1,
      roughness: 0.55,
      side: mat.side,
    })
  }

  return new THREE.MeshStandardMaterial({
    name: mat.name,
    color: 0x888890,
    metalness: 0.15,
    roughness: 0.5,
  })
}

export function collectFbxMaterialSummary(root: THREE.Object3D) {
  const rows: Array<{
    mesh: string
    material: string
    color: string | null
    hasMap: boolean
  }> = []

  root.traverse((child) => {
    if (!(child instanceof THREE.Mesh)) return
    const mats = Array.isArray(child.material) ? child.material : [child.material]
    for (const mat of mats) {
      const color =
        mat && 'color' in mat && mat.color instanceof THREE.Color
          ? `#${mat.color.getHexString()}`
          : null
      rows.push({
        mesh: child.name,
        material: mat?.name ?? '',
        color,
        hasMap: !!(mat && 'map' in mat && mat.map),
      })
    }
  })

  return rows
}
