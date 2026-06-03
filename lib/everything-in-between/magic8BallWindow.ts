import * as THREE from 'three'

export type Magic8BallWindowAnchor = {
  /** Center of the glass circle in ball-local space. */
  localPosition: THREE.Vector3
  /** Outward normal at the window (ball-local, unit). */
  localNormal: THREE.Vector3
  /** Approximate glass circle radius in ball-local xz. */
  radius: number
}

export type Magic8BallGlassTarget = {
  /** Root-local position — die sits on the glass disk. */
  position: THREE.Vector3
  rotation: THREE.Quaternion
}

const _vertex = new THREE.Vector3()
const _ballInverse = new THREE.Matrix4()
const _localVerts: THREE.Vector3[] = []

/** Die answer triangle faces +Y in the authored Dice.obj. */
const DIE_ANSWER_AXIS = new THREE.Vector3(0, 1, 0)

/**
 * Finds the recessed window circle from ball mesh vertices (top cap band).
 * Call after normalize + ball.rotation so anchors match the prepared scene.
 */
export function computeMagic8BallWindowAnchor(
  ball: THREE.Object3D,
): Magic8BallWindowAnchor {
  _localVerts.length = 0
  ball.updateMatrixWorld(true)
  _ballInverse.copy(ball.matrixWorld).invert()

  ball.traverse((child) => {
    if (!(child instanceof THREE.Mesh)) return
    const position = child.geometry.getAttribute('position')
    if (!position) return
    child.updateMatrixWorld(true)
    for (let i = 0; i < position.count; i += 1) {
      _vertex.fromBufferAttribute(position, i)
      _vertex.applyMatrix4(child.matrixWorld).applyMatrix4(_ballInverse)
      _localVerts.push(_vertex.clone())
    }
  })

  let maxY = -Infinity
  let minY = Infinity
  for (const v of _localVerts) {
    if (v.y > maxY) maxY = v.y
    if (v.y < minY) minY = v.y
  }

  const span = Math.max(maxY - minY, 1e-6)
  const bandMin = maxY - span * 0.14
  const bandMax = maxY - span * 0.006

  const band = _localVerts.filter((v) => v.y >= bandMin && v.y <= bandMax)
  const source = band.length > 12 ? band : _localVerts.filter((v) => v.y >= maxY - span * 0.2)

  let cx = 0
  let cy = 0
  let cz = 0
  for (const v of source) {
    cx += v.x
    cy += v.y
    cz += v.z
  }
  cx /= source.length || 1
  cy /= source.length || 1
  cz /= source.length || 1

  const radii = source
    .map((v) => Math.hypot(v.x - cx, v.z - cz))
    .sort((a, b) => a - b)
  const radius =
    radii[Math.floor(radii.length * 0.88)] ??
    radii[radii.length - 1] ??
    span * 0.12

  const inner = source.filter((v) => Math.hypot(v.x - cx, v.z - cz) <= radius * 0.92)
  const windowVerts = inner.length > 8 ? inner : source

  const localPosition = new THREE.Vector3()
  for (const v of windowVerts) localPosition.add(v)
  localPosition.divideScalar(windowVerts.length || 1)

  return {
    localPosition,
    localNormal: new THREE.Vector3(0, 1, 0),
    radius,
  }
}

/**
 * Glass circle on the top cap. Uses mesh-derived anchor so the die lands in the circle.
 */
export function getMagic8BallGlassTarget(
  ball: THREE.Object3D,
  anchor: Magic8BallWindowAnchor,
  dieHalfDepth = 0,
): Magic8BallGlassTarget {
  ball.updateMatrixWorld(true)

  const position = anchor.localPosition.clone().applyMatrix4(ball.matrix)
  const normal = anchor.localNormal.clone().transformDirection(ball.matrix).normalize()

  if (dieHalfDepth > 0) {
    position.addScaledVector(normal, -dieHalfDepth * 0.88)
  }
  position.addScaledVector(normal, -anchor.radius * 0.42)

  const rotation = new THREE.Quaternion().setFromUnitVectors(DIE_ANSWER_AXIS, normal)

  return { position, rotation }
}

/** Die rests inside the ball before it floats to the glass. */
export function getMagic8BallDieHome(): THREE.Vector3 {
  return new THREE.Vector3(0, -0.1, 0)
}
