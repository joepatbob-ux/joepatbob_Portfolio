import { applyMagic8BallMaterials } from '@/lib/everything-in-between/magic8BallMaterials'
import { computeMagic8BallWindowAnchor } from '@/lib/everything-in-between/magic8BallWindow'
import type { Magic8BallPbrTextures } from '@/lib/everything-in-between/useMagic8BallPbrTextures'
import { fixInvertedMeshNormals } from '@/lib/phone-swap/mtlPhongToStandard'
import { normalizeModel } from '@/lib/phone-swap/normalizeModel'
import * as THREE from 'three'

const BALL_TARGET_MAX = 8
/** Max die dimension as a fraction of the glass circle diameter. */
const DIE_WINDOW_DIAMETER_FILL = 9

function cloneRaw(raw: THREE.Object3D) {
  const scene = raw.clone(true)
  scene.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      child.geometry = child.geometry.clone()
    }
  })
  return scene
}

function centerObject(root: THREE.Object3D) {
  root.updateMatrixWorld(true)
  const box = new THREE.Box3().setFromObject(root)
  const center = box.getCenter(new THREE.Vector3())
  root.position.sub(center)
  root.updateMatrixWorld(true)
}

function scaleDieToWindow(
  die: THREE.Object3D,
  windowRadius: number,
) {
  die.updateMatrixWorld(true)
  const dieBox = new THREE.Box3().setFromObject(die)
  const dieSize = dieBox.getSize(new THREE.Vector3())
  const maxDieDim = Math.max(dieSize.x, dieSize.y, dieSize.z) || 1
  const target = windowRadius * 2 * DIE_WINDOW_DIAMETER_FILL
  die.scale.setScalar(target / maxDieDim)
  centerObject(die)
}

export type PreparedMagic8BallScene = {
  root: THREE.Group
  ball: THREE.Object3D
  die: THREE.Object3D
  fitRadius: number
  windowAnchor: ReturnType<typeof computeMagic8BallWindowAnchor>
}

/** Ball + inner die, centered with authored PBR materials. */
export function prepareMagic8BallScene(
  ballRaw: THREE.Object3D,
  dieRaw: THREE.Object3D,
  textures: Magic8BallPbrTextures,
): PreparedMagic8BallScene {
  const ball = cloneRaw(ballRaw)
  const die = cloneRaw(dieRaw)

  fixInvertedMeshNormals(ball)
  fixInvertedMeshNormals(die)

  applyMagic8BallMaterials(ball, textures)
  applyMagic8BallMaterials(die, textures)

  const { radius } = normalizeModel(ball, BALL_TARGET_MAX)

  /* Face the printed 8 toward +Z (camera) at idle. */
  ball.rotation.y = Math.PI

  const windowAnchor = computeMagic8BallWindowAnchor(ball)
  scaleDieToWindow(die, windowAnchor.radius)

  const root = new THREE.Group()
  root.add(ball)
  root.add(die)

  return { root, ball, die, fitRadius: radius, windowAnchor }
}
