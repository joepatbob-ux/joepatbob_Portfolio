import { useLoader } from '@react-three/fiber'
import { useLayoutEffect, useMemo } from 'react'
import { DataTexture, RGBAFormat, SRGBColorSpace, TextureLoader, UnsignedByteType } from 'three'
import {
  PIXEL8_BODY_ATLAS,
  PIXEL8_BODY_ATLAS_FILES,
  PIXEL8_FBX,
  PIXEL8_FBX_RESOURCE_PATH,
  PIXEL8_USE_FBX,
  type Pixel8MaterialMaps,
} from '@/lib/phone-swap/pixel8Assets'
import { PHONE_SWAP_URLS } from '@/lib/phone-swap/phoneSwapUrls'
import { preparePixel8Scene } from '@/lib/phone-swap/preparePixel8Scene'
import { useFbxModel } from '@/lib/phone-swap/useFbxModel'
import { useGlb } from '@/lib/phone-swap/useGlb'

// Neutral dark placeholder so the screen is invisible until PhoneScreenshotTextureBinder applies the real screenshot.
const BLACK_SCREEN = new DataTexture(new Uint8Array([0, 0, 0, 255]), 1, 1, RGBAFormat, UnsignedByteType)
BLACK_SCREEN.needsUpdate = true

function usePixel8ProTexMaps(): Pixel8MaterialMaps {
  const urls = PHONE_SWAP_URLS.pixel8
  const loaderUrls = [
    urls.logoAlpha,
    urls.speakerGrilleAlpha,
    urls.speakerAlpha,
  ]
  if (PIXEL8_BODY_ATLAS) {
    loaderUrls.unshift(PIXEL8_BODY_ATLAS_FILES[PIXEL8_BODY_ATLAS])
  }

  const loaded = useLoader(TextureLoader, loaderUrls)

  useLayoutEffect(() => {
    loaded.forEach((tex) => {
      tex.colorSpace = SRGBColorSpace
      tex.needsUpdate = true
    })
  }, [loaded])

  return useMemo(() => {
    let i = 0
    const bodyAtlas = PIXEL8_BODY_ATLAS ? loaded[i++] : undefined
    const logoAlpha = loaded[i++]!
    const speakerGrilleAlpha = loaded[i++]!
    const speakerAlpha = loaded[i]!
    return { logoAlpha, speakerGrilleAlpha, speakerAlpha, bodyAtlas }
  }, [loaded])
}

function usePixel8ObjScene() {
  const urls = PHONE_SWAP_URLS.pixel8
  const raw = useGlb(urls.glb)
  const materialMaps = usePixel8ProTexMaps()

  return useMemo(
    () =>
      preparePixel8Scene(raw, BLACK_SCREEN, materialMaps, {
        applyScreen: true,
        useFbxMaterials: false,
      }),
    [raw, materialMaps],
  )
}

function usePixel8FbxScene() {
  const raw = useFbxModel(PIXEL8_FBX, PIXEL8_FBX_RESOURCE_PATH)
  const materialMaps = usePixel8ProTexMaps()

  return useMemo(
    () =>
      preparePixel8Scene(raw, BLACK_SCREEN, materialMaps, {
        applyScreen: true,
        useFbxMaterials: true,
      }),
    [raw, materialMaps],
  )
}

/** Cream → OBJ+MTL; otherwise FBX when {@link PIXEL8_USE_FBX}. */
export function usePixel8SceneGraph() {
  // PIXEL8_USE_FBX is a build-time constant, so the same branch runs on every
  // render and hook order is stable. Calling both would load both models.
  if (PIXEL8_USE_FBX) {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    return usePixel8FbxScene()
  }
  // eslint-disable-next-line react-hooks/rules-of-hooks
  return usePixel8ObjScene()
}

export { usePixel8ObjScene }
