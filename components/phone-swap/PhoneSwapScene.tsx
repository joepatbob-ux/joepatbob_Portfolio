'use client'

import { PhoneModel } from '@/components/phone-swap/PhoneModel'
import { Environment, OrbitControls } from '@react-three/drei'
import { useLoader } from '@react-three/fiber'
import { useEffect, useLayoutEffect, useMemo, type ComponentProps } from 'react'
import * as THREE from 'three'
import { debugLog } from '@/lib/phone-swap/debugLog'
import { prepareAndroidScene } from '@/lib/phone-swap/prepareAndroidScene'
import { IPHONE16_TEXTURES } from '@/lib/phone-swap/iphone16Assets'
import { prepareIPhone16Scene } from '@/lib/phone-swap/prepareIPhone16Scene'
import { useObjMtl } from '@/lib/phone-swap/useObjMtl'

const ANDROID_TEXTURES = {
  baseColor: '/models/smartphone_03/smartphone_03_baseColor.png',
  screen: '/models/Android.png',
} as const

interface Props {
  swapped: boolean
}

function useAndroidScene() {
  const raw = useObjMtl('/models/android.obj', '/models/android.mtl')
  const textures = useLoader(THREE.TextureLoader, [
    ANDROID_TEXTURES.baseColor,
    ANDROID_TEXTURES.screen,
  ])

  useLayoutEffect(() => {
    textures.forEach((tex) => {
      tex.colorSpace = THREE.SRGBColorSpace
      tex.needsUpdate = true
    })
  }, [textures])

  return useMemo(() => {
    const [baseColor, screenTexture] = textures
    return prepareAndroidScene(raw, baseColor, screenTexture).scene
  }, [raw, textures])
}

function useIPhoneScene() {
  const raw = useObjMtl(IPHONE16_TEXTURES.obj, IPHONE16_TEXTURES.mtl)
  const textures = useLoader(THREE.TextureLoader, [
    IPHONE16_TEXTURES.screen,
    IPHONE16_TEXTURES.brushNormalRough,
    IPHONE16_TEXTURES.brushNormalSatin,
    IPHONE16_TEXTURES.flash,
    IPHONE16_TEXTURES.screwGrooves,
    IPHONE16_TEXTURES.frontCamera,
    IPHONE16_TEXTURES.speakerAlpha,
    IPHONE16_TEXTURES.speakerBump,
  ])

  useLayoutEffect(() => {
    const [screen, brushRough, brushSatin, ...colorMaps] = textures
    screen.colorSpace = THREE.SRGBColorSpace
    brushRough.colorSpace = THREE.NoColorSpace
    brushSatin.colorSpace = THREE.NoColorSpace
    colorMaps.forEach((tex) => {
      tex.colorSpace = THREE.SRGBColorSpace
      tex.needsUpdate = true
    })
    screen.needsUpdate = true
    brushRough.needsUpdate = true
    brushSatin.needsUpdate = true
  }, [textures])

  return useMemo(() => {
    const [
      screenTexture,
      brushNormalRough,
      brushNormalSatin,
      flash,
      screwGrooves,
      frontCamera,
      speakerAlpha,
      speakerBump,
    ] = textures
    return prepareIPhone16Scene(
      raw,
      {
        brushNormalRough,
        brushNormalSatin,
        flash,
        screwGrooves,
        frontCamera,
        speakerAlpha,
        speakerBump,
      },
      screenTexture,
    ).scene
  }, [raw, textures])
}

export function IPhoneModel(props: Omit<ComponentProps<typeof PhoneModel>, 'scene'>) {
  const scene = useIPhoneScene()
  return <PhoneModel scene={scene} {...props} />
}

export function AndroidModel(props: Omit<ComponentProps<typeof PhoneModel>, 'scene'>) {
  const scene = useAndroidScene()
  return <PhoneModel scene={scene} {...props} />
}

export function PhoneSwapScene({ swapped }: Props) {
  // #region agent log
  useEffect(() => {
    debugLog(
      'PhoneSwapScene.tsx:mount',
      'dual phone swap scene',
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
      <color attach="background" args={['#d8d8d8']} />
      <Environment preset="city" />
      <ambientLight intensity={0.75} />
      <directionalLight position={[5, 8, 6]} intensity={1.4} />
      <directionalLight position={[-4, 2, -4]} intensity={0.4} />
      <AndroidModel {...android} />
      <IPhoneModel {...iphone} />
      <OrbitControls makeDefault enablePan={false} target={[0, 0, 0]} />
    </>
  )
}
