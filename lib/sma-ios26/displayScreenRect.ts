import * as THREE from 'three'

export type DisplayScreenRect = {
  left: number
  top: number
  width: number
  height: number
}

const vCorner = new THREE.Vector3()
const vSize = new THREE.Vector3()

/**
 * Axis-aligned screen bounds for the iPhone display quad (canvas pixel coords).
 */
export function projectedDisplayScreenRect(
  mesh: THREE.Mesh,
  camera: THREE.Camera,
  viewport: { width: number; height: number },
): DisplayScreenRect | null {
  const geo = mesh.geometry
  if (!geo.boundingBox) geo.computeBoundingBox()
  const box = geo.boundingBox
  if (!box || box.isEmpty()) return null

  mesh.updateWorldMatrix(true, false)

  const size = box.getSize(vSize)
  const axes = [
    { axis: 0, len: size.x },
    { axis: 1, len: size.y },
    { axis: 2, len: size.z },
  ].sort((a, b) => b.len - a.len)

  const widthAxis = axes[0].axis
  const heightAxis = axes[1].axis
  const normalAxis = axes[2].axis

  const center = box.getCenter(new THREE.Vector3())
  const toCamera = camera.position.clone()
  mesh.worldToLocal(toCamera)
  toCamera.sub(center)
  const normalMax = toCamera.getComponent(normalAxis) >= 0

  const corner = (
    wMax: boolean,
    hMax: boolean,
  ) => {
    vCorner.set(box.min.x, box.min.y, box.min.z)
    vCorner.setComponent(
      widthAxis,
      wMax ? box.max.getComponent(widthAxis) : box.min.getComponent(widthAxis),
    )
    vCorner.setComponent(
      heightAxis,
      hMax ? box.max.getComponent(heightAxis) : box.min.getComponent(heightAxis),
    )
    vCorner.setComponent(
      normalAxis,
      normalMax ? box.max.getComponent(normalAxis) : box.min.getComponent(normalAxis),
    )
    mesh.localToWorld(vCorner)
    return vCorner.clone()
  }

  const corners = [
    corner(false, false),
    corner(true, false),
    corner(true, true),
    corner(false, true),
  ]

  let minX = Infinity
  let maxX = -Infinity
  let minY = Infinity
  let maxY = -Infinity

  for (const point of corners) {
    point.project(camera)
    const sx = (point.x * 0.5 + 0.5) * viewport.width
    const sy = (-point.y * 0.5 + 0.5) * viewport.height
    minX = Math.min(minX, sx)
    maxX = Math.max(maxX, sx)
    minY = Math.min(minY, sy)
    maxY = Math.max(maxY, sy)
  }

  const width = maxX - minX
  const height = maxY - minY
  if (width < 4 || height < 4) return null

  return { left: minX, top: minY, width, height }
}

/** Canvas-relative rect (for R3F raycast / capture inside the viewbox). */
export function displayRectInCanvas(
  mesh: THREE.Mesh,
  camera: THREE.Camera,
  canvas: HTMLCanvasElement,
): DisplayScreenRect | null {
  const rect = canvas.getBoundingClientRect()
  const screen = projectedDisplayScreenRect(mesh, camera, {
    width: rect.width,
    height: rect.height,
  })
  if (!screen) return null

  return {
    left: screen.left - rect.left,
    top: screen.top - rect.top,
    width: screen.width,
    height: screen.height,
  }
}

export function applyScreenTextureSettings(texture: THREE.Texture): THREE.Texture {
  texture.colorSpace = THREE.SRGBColorSpace
  texture.flipY = false
  texture.wrapS = THREE.ClampToEdgeWrapping
  texture.wrapT = THREE.ClampToEdgeWrapping
  texture.needsUpdate = true
  return texture
}
