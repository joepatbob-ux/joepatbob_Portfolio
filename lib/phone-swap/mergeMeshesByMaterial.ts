import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'

export function meshMaterialSlot(mesh: THREE.Mesh): string {
  const mat = mesh.material
  const m = Array.isArray(mat) ? mat[0] : mat
  return m?.name || mesh.name
}

/** Combine same-named mesh siblings (OBJ material islands) into one draw call. */
export function mergeMeshesByMaterialName(
  root: THREE.Object3D,
  materialName: string,
): { mergedGroups: number; removedMeshes: number; meshCount: number } {
  const byParent = new Map<THREE.Object3D, THREE.Mesh[]>()

  root.traverse((child) => {
    if (!(child instanceof THREE.Mesh) || child.name !== materialName) return
    const parent = child.parent
    if (!parent) return
    const list = byParent.get(parent) ?? []
    list.push(child)
    byParent.set(parent, list)
  })

  let mergedGroups = 0
  let removedMeshes = 0

  for (const [parent, meshes] of byParent) {
    if (meshes.length <= 1) continue

    const geometries = meshes.map((mesh) => mesh.geometry.clone())
    const mergedGeometry = mergeGeometries(geometries, false)
    if (!mergedGeometry) continue

    const mergedMesh = new THREE.Mesh(mergedGeometry, meshes[0].material)
    mergedMesh.name = materialName
    mergedMesh.renderOrder = meshes[0].renderOrder
    mergedMesh.frustumCulled = meshes[0].frustumCulled

    for (const mesh of meshes) {
      parent.remove(mesh)
      mesh.geometry.dispose()
      removedMeshes += 1
    }
    parent.add(mergedMesh)
    mergedGroups += 1
  }

  let meshCount = 0
  root.traverse((child) => {
    if (child instanceof THREE.Mesh && child.name === materialName) meshCount += 1
  })

  return { mergedGroups, removedMeshes, meshCount }
}

/** Merge every material name that was split into multiple mesh islands. */
export function mergeAllMaterialIslands(root: THREE.Object3D): {
  materialName: string
  meshCount: number
  removedMeshes: number
}[] {
  const counts = new Map<string, number>()
  root.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      counts.set(child.name, (counts.get(child.name) ?? 0) + 1)
    }
  })

  const results: {
    materialName: string
    meshCount: number
    removedMeshes: number
  }[] = []

  for (const [materialName, count] of counts) {
    if (count <= 1) continue
    const { meshCount, removedMeshes } = mergeMeshesByMaterialName(
      root,
      materialName,
    )
    results.push({ materialName, meshCount, removedMeshes })
  }

  return results
}

/** Merge siblings that share a Three.js material slot (Pixel 8 group names differ). */
export function mergeMeshesByMaterialSlot(
  root: THREE.Object3D,
  slotName: string,
): { mergedGroups: number; removedMeshes: number; meshCount: number } {
  const byParent = new Map<THREE.Object3D, THREE.Mesh[]>()

  root.traverse((child) => {
    if (!(child instanceof THREE.Mesh) || meshMaterialSlot(child) !== slotName) {
      return
    }
    const parent = child.parent
    if (!parent) return
    const list = byParent.get(parent) ?? []
    list.push(child)
    byParent.set(parent, list)
  })

  let mergedGroups = 0
  let removedMeshes = 0

  for (const [parent, meshes] of byParent) {
    if (meshes.length <= 1) {
      meshes[0].name = slotName
      continue
    }

    const geometries = meshes.map((mesh) => mesh.geometry.clone())
    const mergedGeometry = mergeGeometries(geometries, false)
    if (!mergedGeometry) continue

    const mergedMesh = new THREE.Mesh(mergedGeometry, meshes[0].material)
    mergedMesh.name = slotName
    mergedMesh.renderOrder = meshes[0].renderOrder
    mergedMesh.frustumCulled = meshes[0].frustumCulled

    for (const mesh of meshes) {
      parent.remove(mesh)
      mesh.geometry.dispose()
      removedMeshes += 1
    }
    parent.add(mergedMesh)
    mergedGroups += 1
  }

  let meshCount = 0
  root.traverse((child) => {
    if (child instanceof THREE.Mesh && meshMaterialSlot(child) === slotName) {
      meshCount += 1
    }
  })

  return { mergedGroups, removedMeshes, meshCount }
}

/** Merge all meshes that share the same material slot; mesh.name becomes slot name. */
export function mergeAllMaterialSlots(root: THREE.Object3D): {
  slotName: string
  meshCount: number
  removedMeshes: number
}[] {
  const counts = new Map<string, number>()
  root.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      const slot = meshMaterialSlot(child)
      counts.set(slot, (counts.get(slot) ?? 0) + 1)
    }
  })

  const results: {
    slotName: string
    meshCount: number
    removedMeshes: number
  }[] = []

  for (const [slotName, count] of counts) {
    if (count <= 1) {
      root.traverse((child) => {
        if (child instanceof THREE.Mesh && meshMaterialSlot(child) === slotName) {
          child.name = slotName
        }
      })
      continue
    }
    const { meshCount, removedMeshes } = mergeMeshesByMaterialSlot(root, slotName)
    results.push({ slotName, meshCount, removedMeshes })
  }

  return results
}
