import * as THREE from 'three'

export type DisplayUVInfo = {
  minU: number
  maxU: number
  minV: number
  maxV: number
  uvW: number
  uvH: number
}

/** Rewrite display UVs from atlas island → unit square so a full screenshot can map 1:1. */
export function remapMeshUVsTo01(mesh: THREE.Mesh): DisplayUVInfo | null {
  const uvAttr = mesh.geometry.getAttribute('uv')
  if (!uvAttr || uvAttr.count === 0) return null

  let minU = Infinity
  let maxU = -Infinity
  let minV = Infinity
  let maxV = -Infinity

  for (let i = 0; i < uvAttr.count; i++) {
    const u = uvAttr.getX(i)
    const v = uvAttr.getY(i)
    minU = Math.min(minU, u)
    maxU = Math.max(maxU, u)
    minV = Math.min(minV, v)
    maxV = Math.max(maxV, v)
  }

  const uvW = Math.max(maxU - minU, 1e-6)
  const uvH = Math.max(maxV - minV, 1e-6)

  for (let i = 0; i < uvAttr.count; i++) {
    const u = (uvAttr.getX(i) - minU) / uvW
    const v = (uvAttr.getY(i) - minV) / uvH
    uvAttr.setXY(i, u, v)
  }
  uvAttr.needsUpdate = true

  return { minU, maxU, minV, maxV, uvW, uvH }
}

/** Flip display V after remap (C4D Display mesh is upside-down vs screenshot). */
export function remapDisplayUVFlipV(mesh: THREE.Mesh): DisplayUVInfo | null {
  const info = remapMeshUVsTo01(mesh)
  const uvAttr = mesh.geometry.getAttribute('uv')
  if (!info || !uvAttr) return info

  for (let i = 0; i < uvAttr.count; i++) {
    uvAttr.setY(i, 1 - uvAttr.getY(i))
  }
  uvAttr.needsUpdate = true
  return info
}

/** Flip display U after remap (mirror wallpaper left ↔ right). */
export function remapDisplayUVFlipU(mesh: THREE.Mesh): DisplayUVInfo | null {
  const info = remapMeshUVsTo01(mesh)
  const uvAttr = mesh.geometry.getAttribute('uv')
  if (!info || !uvAttr) return info

  for (let i = 0; i < uvAttr.count; i++) {
    uvAttr.setX(i, 1 - uvAttr.getX(i))
  }
  uvAttr.needsUpdate = true
  return info
}

/** Remap to 0–1, then flip V and U (Pixel 8 stock wallpaper orientation). */
export function remapDisplayUVFlipVU(mesh: THREE.Mesh): DisplayUVInfo | null {
  const info = remapDisplayUVFlipV(mesh)
  const uvAttr = mesh.geometry.getAttribute('uv')
  if (!info || !uvAttr) return info

  for (let i = 0; i < uvAttr.count; i++) {
    uvAttr.setX(i, 1 - uvAttr.getX(i))
  }
  uvAttr.needsUpdate = true
  return info
}

export function screenTextureForDisplay(source: THREE.Texture): THREE.Texture {
  const map = source.clone()
  map.colorSpace = THREE.SRGBColorSpace
  map.flipY = false
  map.wrapS = THREE.ClampToEdgeWrapping
  map.wrapT = THREE.ClampToEdgeWrapping
  map.repeat.set(1, 1)
  map.offset.set(0, 0)
  map.needsUpdate = true
  return map
}

/**
 * Generate flat XY-projected UVs for a screen mesh that has POSITION but no TEXCOORD_0.
 * No-op if the mesh already has a uv attribute.
 * flipU compensates for mirrorModelX (scale.x = -1) which doesn't touch vertex positions.
 */
export function generateScreenUVsFromPosition(mesh: THREE.Mesh, flipU = false): boolean {
  if (mesh.geometry.getAttribute('uv')) return false

  const pos = mesh.geometry.getAttribute('position')
  if (!pos) return false

  let xMin = Infinity, xMax = -Infinity
  let yMin = Infinity, yMax = -Infinity

  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i)
    const y = pos.getY(i)
    xMin = Math.min(xMin, x)
    xMax = Math.max(xMax, x)
    yMin = Math.min(yMin, y)
    yMax = Math.max(yMax, y)
  }

  const xRange = Math.max(xMax - xMin, 1e-6)
  const yRange = Math.max(yMax - yMin, 1e-6)
  const uvData = new Float32Array(pos.count * 2)

  for (let i = 0; i < pos.count; i++) {
    let u = (pos.getX(i) - xMin) / xRange
    const v = (pos.getY(i) - yMin) / yRange
    if (flipU) u = 1 - u
    uvData[i * 2] = u
    uvData[i * 2 + 1] = v
  }

  mesh.geometry.setAttribute('uv', new THREE.BufferAttribute(uvData, 2))
  return true
}

/** Shift display vertices along normals so the PNG wins over coplanar glass. */
export function nudgeGeometryAlongNormals(
  geometry: THREE.BufferGeometry,
  amount: number,
): void {
  if (amount === 0) return
  geometry.computeVertexNormals()
  const pos = geometry.attributes.position
  const nor = geometry.attributes.normal
  if (!pos || !nor) return

  for (let i = 0; i < pos.count; i++) {
    pos.setXYZ(
      i,
      pos.getX(i) + nor.getX(i) * amount,
      pos.getY(i) + nor.getY(i) * amount,
      pos.getZ(i) + nor.getZ(i) * amount,
    )
  }
  pos.needsUpdate = true
  geometry.computeBoundingBox()
  geometry.computeBoundingSphere()
}
