'use client'

import { PhoneModel } from '@/components/phone-swap/PhoneModel'
import { Environment, OrbitControls } from '@react-three/drei'
import { useLoader } from '@react-three/fiber'
import { useEffect, useLayoutEffect, useMemo, type ComponentProps } from 'react'
import { NoColorSpace, SRGBColorSpace, TextureLoader } from 'three'
import { debugLog } from '@/lib/phone-swap/debugLog'
import { PHONE_SWAP_URLS } from '@/lib/phone-swap/phoneSwapUrls'
import { prepareIPhone16Scene } from '@/lib/phone-swap/prepareIPhone16Scene'
import { usePixel8SceneGraph } from '@/lib/phone-swap/usePixel8SceneGraph'
import { useObjMtl } from '@/lib/phone-swap/useObjMtl'

interface Props {
  swapped: boolean
}

function usePixel8Scene() {
  return usePixel8SceneGraph().scene
}

function useIPhoneScene() {
  const urls = PHONE_SWAP_URLS.iphone16
  const raw = useObjMtl(urls.obj, urls.mtl)
  const textures = useLoader(TextureLoader, [
    urls.screen,
    urls.brushNormalRough,
    urls.brushNormalSatin,
    urls.flash,
    urls.screwGrooves,
    urls.frontCamera,
    urls.speakerAlpha,
    urls.speakerBump,
  ])

  useLayoutEffect(() => {
    const [screen, brushRough, brushSatin, ...colorMaps] = textures
    screen.colorSpace = SRGBColorSpace
    brushRough.colorSpace = NoColorSpace
    brushSatin.colorSpace = NoColorSpace
    colorMaps.forEach((tex) => {
      tex.colorSpace = SRGBColorSpace
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
  const scene = usePixel8Scene()
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
