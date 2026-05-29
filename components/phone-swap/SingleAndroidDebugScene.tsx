'use client'

import { FitCamera } from '@/components/phone-swap/FitCamera'
import { OrbitControls } from '@react-three/drei'
import { useLoader } from '@react-three/fiber'
import { useEffect, useLayoutEffect, useMemo } from 'react'
import * as THREE from 'three'
import { debugLog } from '@/lib/phone-swap/debugLog'
import { prepareAndroidScene } from '@/lib/phone-swap/prepareAndroidScene'
import { useObjMtl } from '@/lib/phone-swap/useObjMtl'

const TEXTURES = {
  baseColor: '/models/smartphone_03/smartphone_03_baseColor.png',
  screen: '/models/Android.png',
} as const

/** One Android phone — body + remapped screen texture. */
export function SingleAndroidDebugScene() {
  const raw = useObjMtl('/models/android.obj', '/models/android.mtl')
  const [baseColor, screenTexture] = useLoader(THREE.TextureLoader, [
    TEXTURES.baseColor,
    TEXTURES.screen,
  ])

  useLayoutEffect(() => {
    baseColor.colorSpace = THREE.SRGBColorSpace
    baseColor.needsUpdate = true
    screenTexture.colorSpace = THREE.SRGBColorSpace
    screenTexture.needsUpdate = true
  }, [baseColor, screenTexture])

  const { scene, fitRadius } = useMemo(
    () => prepareAndroidScene(raw, baseColor, screenTexture),
    [raw, baseColor, screenTexture],
  )

  // #region agent log
  useEffect(() => {
    debugLog(
      'SingleAndroidDebugScene.tsx:mount',
      'single-model scene mounted',
      { fitRadius },
      'S',
      'post-fix',
    )
  }, [fitRadius])
  // #endregion

  return (
    <>
      <color attach="background" args={['#d8d8d8']} />
      <ambientLight intensity={0.75} />
      <directionalLight position={[5, 8, 6]} intensity={1.4} />
      <directionalLight position={[-4, 2, -4]} intensity={0.4} />
      <primitive object={scene} />
      <OrbitControls makeDefault enablePan={false} target={[0, 0, 0]} />
      <FitCamera subject={scene} />
    </>
  )
}
