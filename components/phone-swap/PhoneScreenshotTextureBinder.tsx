'use client'

import { updatePhoneScreenTextures } from '@/lib/phone-swap/updatePhoneScreenTextures'
import { useThree } from '@react-three/fiber'
import { useLayoutEffect, useRef, type RefObject } from 'react'
import * as THREE from 'three'
import { SRGBColorSpace, TextureLoader } from 'three'

interface Props {
  androidScreenUrl: string
  iphoneScreenUrl: string
  androidRef: RefObject<THREE.Group | null>
  iphoneRef: RefObject<THREE.Group | null>
  /** Re-bind when prepared scene identity changes (useMemo rebuild). */
  androidScene?: THREE.Object3D
  iphoneScene?: THREE.Object3D
}

/** Loads active screenshot URLs and applies them to the mounted phone scenes. */
export function PhoneScreenshotTextureBinder({
  androidScreenUrl,
  iphoneScreenUrl,
  androidRef,
  iphoneRef,
  androidScene,
  iphoneScene,
}: Props) {
  const { invalidate } = useThree()
  const texturesRef = useRef<{
    android: THREE.Texture | null
    iphone: THREE.Texture | null
  }>({ android: null, iphone: null })

  useLayoutEffect(() => {
    let cancelled = false
    const loader = new TextureLoader()
    let androidTexture: THREE.Texture | null = null
    let iphoneTexture: THREE.Texture | null = null

    void Promise.all([
      loader.loadAsync(androidScreenUrl),
      loader.loadAsync(iphoneScreenUrl),
    ]).then(([android, iphone]) => {
      if (cancelled) {
        android.dispose()
        iphone.dispose()
        return
      }

      androidTexture = android
      iphoneTexture = iphone
      texturesRef.current = { android, iphone }
      android.colorSpace = SRGBColorSpace
      iphone.colorSpace = SRGBColorSpace
      android.needsUpdate = true
      iphone.needsUpdate = true

      updatePhoneScreenTextures(androidRef.current, android)
      updatePhoneScreenTextures(iphoneRef.current, iphone)
      invalidate()
    }).catch(() => {})

    return () => {
      cancelled = true
      androidTexture?.dispose()
      iphoneTexture?.dispose()
    }
  }, [
    androidScreenUrl,
    iphoneScreenUrl,
    androidRef,
    iphoneRef,
    androidScene,
    iphoneScene,
    invalidate,
  ])

  useLayoutEffect(() => {
    const { android, iphone } = texturesRef.current
    if (!android || !iphone) return
    updatePhoneScreenTextures(androidRef.current, android)
    updatePhoneScreenTextures(iphoneRef.current, iphone)
    invalidate()
  }, [androidScene, iphoneScene, androidRef, iphoneRef, invalidate])

  return null
}
