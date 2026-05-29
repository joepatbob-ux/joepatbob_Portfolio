import * as THREE from 'three'

export type ModelMaterialStats = {
  meshCount: number
  withMap: number
  withoutMap: number
}

const preparedRoots = new WeakSet<THREE.Object3D>()

function toStandardMaterial(
  mat: THREE.Material,
  stats: ModelMaterialStats,
): THREE.MeshStandardMaterial {
  if (mat instanceof THREE.MeshStandardMaterial) {
    if (mat.map) stats.withMap += 1
    else stats.withoutMap += 1
    mat.side = THREE.DoubleSide
    mat.transparent = false
    mat.opacity = 1
    mat.depthWrite = true
    return mat
  }

  const phong = mat as THREE.MeshPhongMaterial
  let map: THREE.Texture | null = null

  if (phong?.map instanceof THREE.Texture) {
    map = phong.map
  } else if ('map' in mat && mat.map instanceof THREE.Texture) {
    map = mat.map
  }

  if (map) {
    map.colorSpace = THREE.SRGBColorSpace
    map.needsUpdate = true
    stats.withMap += 1
  } else {
    stats.withoutMap += 1
  }

  const color =
    phong?.color instanceof THREE.Color
      ? phong.color.clone()
      : new THREE.Color(0xbbbbbb)

  if (color.r + color.g + color.b < 0.08) {
    color.setHex(0xbbbbbb)
  }

  return new THREE.MeshStandardMaterial({
    map,
    color: map ? new THREE.Color(0xffffff) : color,
    metalness: 0.18,
    roughness: 0.45,
    side: THREE.DoubleSide,
    transparent: false,
    opacity: 1,
    depthWrite: true,
  })
}

/** Convert Phong/MTL materials to lit Standard materials (safe for shared OBJ cache). */
export function prepareModelMaterials(root: THREE.Object3D): ModelMaterialStats {
  const stats: ModelMaterialStats = { meshCount: 0, withMap: 0, withoutMap: 0 }

  root.traverse((child) => {
    if (!(child instanceof THREE.Mesh)) return
    stats.meshCount += 1

    const source = child.material
    if (Array.isArray(source)) {
      child.material = source.map((mat) => toStandardMaterial(mat, stats))
    } else {
      child.material = toStandardMaterial(source, stats)
    }
    child.frustumCulled = false
  })

  return stats
}

/** Prepare the cached OBJ root once — clones share materials; never dispose shared mats. */
export function prepareModelMaterialsOnce(root: THREE.Object3D): ModelMaterialStats {
  if (preparedRoots.has(root)) {
    return { meshCount: 0, withMap: 0, withoutMap: 0 }
  }
  preparedRoots.add(root)
  return prepareModelMaterials(root)
}
