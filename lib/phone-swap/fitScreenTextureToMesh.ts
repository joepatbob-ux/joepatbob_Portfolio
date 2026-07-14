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
  // The phone is viewed at a tilt, so the screen texture is minified along the
  // grazing axis — at the default anisotropy of 1 that reads as a blurry,
  // "low-res" screen no matter how sharp the source is. Request the max; three
  // clamps it to the hardware limit at upload (mipmaps are on by default, which
  // anisotropic filtering needs).
  map.anisotropy = 16
  map.needsUpdate = true
  return map
}

/**
 * Generate flat projected UVs for a screen mesh that has POSITION but no TEXCOORD_0.
 * No-op if the mesh already has a uv attribute.
 *
 * Automatically picks the two axes with the largest spans (the screen plane),
 * discarding the thin depth axis. The larger span maps to V (height) and the
 * second-largest maps to U (width) — correct for portrait phones.
 *
 * flipU compensates for mirrorModelX (scale.x = -1) which doesn't touch vertex positions.
 */
export function generateScreenUVsFromPosition(mesh: THREE.Mesh, flipU = false): boolean {
  const existing = mesh.geometry.getAttribute('uv')
  if (existing) {
    let hasNonZero = false
    for (let i = 0; i < existing.count; i++) {
      if (existing.getX(i) !== 0 || existing.getY(i) !== 0) {
        hasNonZero = true
        break
      }
    }
    if (existing.count > 0 && hasNonZero) return false
    mesh.geometry.deleteAttribute('uv')
  }

  const pos = mesh.geometry.getAttribute('position')
  if (!pos) return false

  let xMin = Infinity, xMax = -Infinity
  let yMin = Infinity, yMax = -Infinity
  let zMin = Infinity, zMax = -Infinity

  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i)
    if (x < xMin) xMin = x; if (x > xMax) xMax = x
    if (y < yMin) yMin = y; if (y > yMax) yMax = y
    if (z < zMin) zMin = z; if (z > zMax) zMax = z
  }

  type AxisDef = { min: number; range: number; get: (i: number) => number }
  const axes: AxisDef[] = [
    { min: xMin, range: xMax - xMin, get: (i) => pos.getX(i) },
    { min: yMin, range: yMax - yMin, get: (i) => pos.getY(i) },
    { min: zMin, range: zMax - zMin, get: (i) => pos.getZ(i) },
  ]
  // Sort descending by span; largest → V (height), second-largest → U (width)
  axes.sort((a, b) => b.range - a.range)
  const vAxis = axes[0]
  const uAxis = axes[1]
  const vRange = Math.max(vAxis.range, 1e-6)
  const uRange = Math.max(uAxis.range, 1e-6)

  const uvData = new Float32Array(pos.count * 2)
  for (let i = 0; i < pos.count; i++) {
    let u = (uAxis.get(i) - uAxis.min) / uRange
    const v = (vAxis.get(i) - vAxis.min) / vRange
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
