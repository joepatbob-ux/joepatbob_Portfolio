'use client'

import { Environment } from '@react-three/drei'
import { useLoader } from '@react-three/fiber'
import { useEffect, useMemo, type ComponentProps } from 'react'
import * as THREE from 'three'
import { debugLog } from '@/lib/phone-swap/debugLog'
import { applyAndroidScreen, applyIPhoneScreen } from '@/lib/phone-swap/applyScreenTextures'
import { normalizeModel } from '@/lib/phone-swap/normalizeModel'
import { prepareModelMaterialsOnce } from '@/lib/phone-swap/prepareModelMaterials'
import { useObjMtl } from '@/lib/phone-swap/useObjMtl'
import { PhoneModel } from '@/components/phone-swap/PhoneModel'
import { SingleAndroidDebugScene } from '@/components/phone-swap/SingleAndroidDebugScene'

/** Set true to debug one Android model with manual textures (no swap). */
const DEBUG_SINGLE_ANDROID = true

interface Props {
  swapped: boolean
}

function modelStats(root: THREE.Object3D) {
  const box = new THREE.Box3().setFromObject(root)
  const size = box.getSize(new THREE.Vector3())
  let meshCount = 0
  let withMap = 0
  root.traverse((child) => {
    if (!(child instanceof THREE.Mesh)) return
    meshCount += 1
    const mat = child.material
    const m = Array.isArray(mat) ? mat[0] : mat
    if (m && 'map' in m && m.map) withMap += 1
  })
  return {
    meshCount,
    withMap,
    maxDim: Math.max(size.x, size.y, size.z),
    boxEmpty: box.isEmpty(),
  }
}

function useScreenTexture(path: string) {
  const texture = useLoader(THREE.TextureLoader, path)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.flipY = true
  return texture
}

function useIPhoneModel() {
  const raw = useObjMtl('/models/iPhone.obj', '/models/iPhone.mtl')
  const screenTexture = useScreenTexture('/models/Iphone.png')

  return useMemo(() => {
    const matStats = prepareModelMaterialsOnce(raw)
    const clone = raw.clone(true)
    normalizeModel(clone)
    applyIPhoneScreen(clone, screenTexture)
    debugLog(
      'PhoneSwapScene.tsx:prepareIPhone',
      'materials prepared',
      matStats,
      'T',
      'post-fix',
    )
    return clone
  }, [raw, screenTexture])
}

function useAndroidModel() {
  const raw = useObjMtl('/models/android.obj', '/models/android.mtl')
  const screenTexture = useScreenTexture('/models/Android.png')

  return useMemo(() => {
    const matStats = prepareModelMaterialsOnce(raw)
    const clone = raw.clone(true)
    normalizeModel(clone)
    applyAndroidScreen(clone, screenTexture)
    debugLog(
      'PhoneSwapScene.tsx:prepareAndroid',
      'materials prepared',
      matStats,
      'T',
      'post-fix',
    )
    return clone
  }, [raw, screenTexture])
}

export function IPhoneModel(props: Omit<ComponentProps<typeof PhoneModel>, 'scene'>) {
  const scene = useIPhoneModel()
  // #region agent log
  useEffect(() => {
    const stats = modelStats(scene)
    debugLog('PhoneSwapScene.tsx:IPhoneModel', 'iPhone model ready', stats, 'B', 'post-fix')
  }, [scene])
  // #endregion
  return <PhoneModel scene={scene} {...props} />
}

export function AndroidModel(props: Omit<ComponentProps<typeof PhoneModel>, 'scene'>) {
  const scene = useAndroidModel()
  // #region agent log
  useEffect(() => {
    const stats = modelStats(scene)
    debugLog('PhoneSwapScene.tsx:AndroidModel', 'Android model ready', stats, 'B', 'post-fix')
  }, [scene])
  // #endregion
  return <PhoneModel scene={scene} {...props} />
}

export function PhoneSwapScene({ swapped }: Props) {
  if (DEBUG_SINGLE_ANDROID) {
    return <SingleAndroidDebugScene />
  }
  return <PhoneSwapSceneDual swapped={swapped} />
}

function PhoneSwapSceneDual({ swapped }: Props) {
  // #region agent log
  useEffect(() => {
    debugLog(
      'PhoneSwapScene.tsx:mount',
      'PhoneSwapScene rendered (Suspense resolved)',
      { swapped },
      'C',
      'post-fix',
    )
  }, [swapped])
  // #endregion

  const android = useMemo(
    () =>
      swapped
        ? {
            position: [-2.2, -0.5, -1] as [number, number, number],
            rotationY: 0.5,
            scale: 0.78,
            renderOrder: 0,
          }
        : {
            position: [0, 0, 0] as [number, number, number],
            rotationY: 0,
            scale: 1,
            renderOrder: 1,
          },
    [swapped],
  )

  const iphone = useMemo(
    () =>
      swapped
        ? {
            position: [0, 0, 0] as [number, number, number],
            rotationY: 0,
            scale: 1,
            renderOrder: 1,
          }
        : {
            position: [2.2, -0.5, -1] as [number, number, number],
            rotationY: -0.5,
            scale: 0.78,
            renderOrder: 0,
          },
    [swapped],
  )

  return (
    <>
      <color attach="background" args={['#d4d4d4']} />
      <Environment preset="city" />
      <ambientLight intensity={0.65} />
      <directionalLight position={[5, 8, 5]} intensity={1.4} castShadow={false} />
      <directionalLight position={[-4, 2, -3]} intensity={0.5} />
      <group>
        <AndroidModel {...android} />
        <IPhoneModel {...iphone} />
      </group>
    </>
  )
}
