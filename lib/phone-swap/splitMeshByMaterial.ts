import * as THREE from 'three'

/** Extract one geometry group into a compact indexed BufferGeometry. */
function extractGroupGeometry(
  source: THREE.BufferGeometry,
  group: THREE.GeometryGroup,
): THREE.BufferGeometry {
  const indexAttr = source.index
  if (!indexAttr || group.count <= 0) {
    return source.clone()
  }

  const position = source.getAttribute('position')
  const normal = source.getAttribute('normal')
  const uv = source.getAttribute('uv')
  const indexArray = indexAttr.array as ArrayLike<number>

  const vertexMap = new Map<number, number>()
  const positions: number[] = []
  const normals: number[] = []
  const uvs: number[] = []
  const indices: number[] = []

  const mapVertex = (oldIndex: number): number => {
    const cached = vertexMap.get(oldIndex)
    if (cached !== undefined) return cached

    const newIndex = positions.length / 3
    vertexMap.set(oldIndex, newIndex)
    positions.push(
      position.getX(oldIndex),
      position.getY(oldIndex),
      position.getZ(oldIndex),
    )
    if (normal) {
      normals.push(
        normal.getX(oldIndex),
        normal.getY(oldIndex),
        normal.getZ(oldIndex),
      )
    }
    if (uv) {
      uvs.push(uv.getX(oldIndex), uv.getY(oldIndex))
    }
    return newIndex
  }

  for (let i = group.start; i < group.start + group.count; i++) {
    indices.push(mapVertex(indexArray[i]))
  }

  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute(
    'position',
    new THREE.Float32BufferAttribute(positions, 3),
  )
  if (normals.length > 0) {
    geometry.setAttribute(
      'normal',
      new THREE.Float32BufferAttribute(normals, 3),
    )
  }
  if (uvs.length > 0) {
    geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2))
  }
  geometry.setIndex(indices)
  return geometry
}

/**
 * OBJ exports often use one `g` group with many `usemtl` slots (MultiMaterial).
 * Phone-swap expects one mesh per material name (GP9p_display, GP9p_mid, …).
 */
export function splitMeshesByMaterial(root: THREE.Object3D): {
  splitCount: number
  meshNames: string[]
} {
  const jobs: {
    parent: THREE.Object3D
    mesh: THREE.Mesh
    replacements: THREE.Mesh[]
  }[] = []

  root.traverse((child) => {
    if (!(child instanceof THREE.Mesh) || !child.parent) return

    const materials = (
      Array.isArray(child.material) ? child.material : [child.material]
    ) as THREE.Material[]

    if (materials.length <= 1) {
      const mat = materials[0]
      if (mat?.name) child.name = mat.name
      return
    }

    const groups = child.geometry.groups
    if (!groups?.length) return

    const replacements: THREE.Mesh[] = []
    for (let gi = 0; gi < groups.length; gi++) {
      const group = groups[gi]
      if (group.count <= 0) continue

      const mat = materials[group.materialIndex ?? gi]
      if (!mat) continue

      const geometry = extractGroupGeometry(child.geometry, group)
      const mesh = new THREE.Mesh(geometry, mat)
      mesh.name = mat.name || `material_${gi}`
      replacements.push(mesh)
    }

    if (replacements.length > 0) {
      jobs.push({ parent: child.parent, mesh: child, replacements })
    }
  })

  for (const { parent, mesh, replacements } of jobs) {
    parent.remove(mesh)
    for (const replacement of replacements) {
      parent.add(replacement)
    }
    mesh.geometry.dispose()
  }

  const meshNames: string[] = []
  root.traverse((child) => {
    if (child instanceof THREE.Mesh) meshNames.push(child.name)
  })

  return { splitCount: jobs.length, meshNames }
}
