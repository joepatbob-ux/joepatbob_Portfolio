import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { meshMaterialSlot } from '@/lib/phone-swap/mergeMeshesByMaterial'

export type ConsolidateResult = {
  slotName: string
  sourceMeshes: number
  merged: boolean
}

/**
 * Flatten the OBJ group hierarchy: one mesh per material slot, world transforms baked in.
 */
export function consolidateMeshesBySlot(root: THREE.Object3D): ConsolidateResult[] {
  const bySlot = new Map<string, THREE.Mesh[]>()

  root.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      const slot = meshMaterialSlot(child)
      const list = bySlot.get(slot) ?? []
      list.push(child)
      bySlot.set(slot, list)
    }
  })

  const mergedRoot = new THREE.Group()
  mergedRoot.name = 'Pixel8Pro'
  const results: ConsolidateResult[] = []
  const toRemove: THREE.Mesh[] = []

  for (const [slotName, meshes] of bySlot) {
    const geoms: THREE.BufferGeometry[] = []

    for (const mesh of meshes) {
      mesh.updateMatrixWorld(true)
      const baked = mesh.geometry.clone()
      baked.applyMatrix4(mesh.matrixWorld)
      geoms.push(baked)
    }

    let mergedGeometry = mergeGeometries(geoms, false)
    const merged = true

    if (!mergedGeometry && geoms.length === 1) {
      mergedGeometry = geoms[0]
    } else if (!mergedGeometry) {
      for (const mesh of meshes) {
        mesh.updateMatrixWorld(true)
        const baked = mesh.geometry.clone()
        baked.applyMatrix4(mesh.matrixWorld)
        const copy = new THREE.Mesh(baked, mesh.material)
        copy.name = slotName
        copy.position.set(0, 0, 0)
        copy.rotation.set(0, 0, 0)
        copy.scale.set(1, 1, 1)
        mergedRoot.add(copy)
        toRemove.push(mesh)
      }
      results.push({ slotName, sourceMeshes: meshes.length, merged: false })
      continue
    }

    const sourceMat = meshes[0].material
    const newMesh = new THREE.Mesh(mergedGeometry, sourceMat)
    newMesh.name = slotName
    newMesh.position.set(0, 0, 0)
    newMesh.rotation.set(0, 0, 0)
    newMesh.scale.set(1, 1, 1)
    mergedRoot.add(newMesh)
    toRemove.push(...meshes)
    results.push({ slotName, sourceMeshes: meshes.length, merged })
  }

  for (const mesh of toRemove) {
    mesh.parent?.remove(mesh)
    mesh.geometry.dispose()
  }

  root.children.slice().forEach((child) => {
    if (child !== mergedRoot) root.remove(child)
  })
  root.add(mergedRoot)

  return results
}
