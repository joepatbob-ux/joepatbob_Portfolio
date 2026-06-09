'use client'

import { updatePhoneScreenTextures } from '@/lib/phone-swap/updatePhoneScreenTextures'
import { useThree } from '@react-three/fiber'
import { useLayoutEffect, type RefObject } from 'react'
import * as THREE from 'three'
import { SRGBColorSpace, TextureLoader } from 'three'

interface Props {
  androidScreenUrl: string
  iphoneScreenUrl: string
  androidRef: RefObject<THREE.Group | null>
  iphoneRef: RefObject<THREE.Group | null>
}

/** Loads active screenshot URLs and applies them to the mounted phone scenes. */
export function PhoneScreenshotTextureBinder({
  androidScreenUrl,
  iphoneScreenUrl,
  androidRef,
  iphoneRef,
}: Props) {
  const { invalidate } = useThree()

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
      android.colorSpace = SRGBColorSpace
      iphone.colorSpace = SRGBColorSpace
      android.needsUpdate = true
      iphone.needsUpdate = true

      updatePhoneScreenTextures(androidRef.current, android)
      updatePhoneScreenTextures(iphoneRef.current, iphone)
      invalidate()
    })

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
    invalidate,
  ])

  return null
}
