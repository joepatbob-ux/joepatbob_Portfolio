import { capturePhoneScreenById } from '@/lib/sma-ios26/phone-screen-capture'
import { subscribeLiveScreenCapture } from '@/lib/sma-ios26/live-screen-capture'
import {
  applyScreenTextureSettings,
  projectedDisplayScreenRect,
  type DisplayScreenRect,
} from '@/lib/sma-ios26/displayScreenRect'
import { IPHONE16_MESH } from '@/lib/phone-swap/iphone16Assets'
import { useFrame, useThree } from '@react-three/fiber'
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import * as THREE from 'three'

type SmaIPhoneLiveScreenProps = {
  scene: THREE.Object3D
  iphoneFocused: boolean
  interactive: boolean
  onScreenRect?: (rect: DisplayScreenRect | null) => void
}

const CAPTURE_INTERVAL_S = 0.12
const CAPTURE_INTERVAL_INTERACTIVE_S = 0.04

/** Live SMA proto on iPhone 16 Display via CanvasTexture + screen overlay. */
export function SmaIPhoneLiveScreen({
  scene,
  iphoneFocused,
  interactive,
  onScreenRect,
}: SmaIPhoneLiveScreenProps) {
  const { camera, gl } = useThree()
  const displayRef = useRef<THREE.Mesh | null>(null)
  const staticMapRef = useRef<THREE.Texture | null>(null)
  const materialRef = useRef<THREE.MeshBasicMaterial | null>(null)
  const liveTextureRef = useRef<THREE.CanvasTexture | null>(null)
  const captureBusy = useRef(false)
  const pendingCapture = useRef(false)
  const lastCapture = useRef(0)
  const [, setTextureReady] = useState(false)

  const runCapture = useCallback((elapsed: number) => {
    if (captureBusy.current) {
      pendingCapture.current = true
      return
    }

    captureBusy.current = true
    pendingCapture.current = false
    void capturePhoneScreenById().then((canvas) => {
      captureBusy.current = false
      lastCapture.current = elapsed

      const liveTexture = liveTextureRef.current
      const mat = materialRef.current
      if (canvas && liveTexture && mat && iphoneFocused) {
        liveTexture.image = canvas
        liveTexture.needsUpdate = true
        if (mat.map !== liveTexture) {
          mat.map = liveTexture
          mat.needsUpdate = true
        }
      }

      if (pendingCapture.current && iphoneFocused) {
        pendingCapture.current = false
        lastCapture.current = 0
      }
    })
  }, [iphoneFocused])

  useLayoutEffect(() => {
    scene.updateMatrixWorld(true)

    const mesh = scene.getObjectByName(IPHONE16_MESH.display)
    if (!(mesh instanceof THREE.Mesh)) return

    displayRef.current = mesh

    const material = mesh.material
    if (material instanceof THREE.MeshBasicMaterial) {
      materialRef.current = material
      staticMapRef.current = material.map
    }

    const canvas = document.createElement('canvas')
    canvas.width = 402
    canvas.height = 874
    const liveTexture = new THREE.CanvasTexture(canvas)
    applyScreenTextureSettings(liveTexture)
    liveTextureRef.current = liveTexture
    setTextureReady(true)

    return () => {
      const mat = materialRef.current
      if (mat) {
        mat.map = staticMapRef.current
        mat.color.set(0xffffff)
        mat.needsUpdate = true
      }
      liveTextureRef.current?.dispose()
      liveTextureRef.current = null
      displayRef.current = null
      materialRef.current = null
      staticMapRef.current = null
    }
  }, [scene])

  useLayoutEffect(() => {
    const mat = materialRef.current
    const liveTexture = liveTextureRef.current
    if (!mat) return

    if (iphoneFocused && liveTexture) {
      mat.map = liveTexture
      mat.color.set(0xffffff)
      mat.needsUpdate = true
      lastCapture.current = 0
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          void capturePhoneScreenById().then((canvas) => {
            if (!canvas || !liveTextureRef.current || !materialRef.current) return
            liveTextureRef.current.image = canvas
            liveTextureRef.current.needsUpdate = true
            materialRef.current.needsUpdate = true
          })
        })
      })
    } else {
      mat.map = staticMapRef.current
      mat.color.set(0xffffff)
      mat.needsUpdate = true
      onScreenRect?.(null)
    }
  }, [iphoneFocused, onScreenRect])

  useEffect(() => {
    if (!iphoneFocused) return
    return subscribeLiveScreenCapture(() => {
      pendingCapture.current = true
      lastCapture.current = 0
    })
  }, [iphoneFocused])

  useFrame(({ clock }) => {
    const display = displayRef.current
    if (!display) return

    const canvasRect = gl.domElement.getBoundingClientRect()
    const screenRect = projectedDisplayScreenRect(display, camera, {
      width: canvasRect.width,
      height: canvasRect.height,
    })

    if (iphoneFocused && screenRect) {
      onScreenRect?.({
        left: canvasRect.left + screenRect.left,
        top: canvasRect.top + screenRect.top,
        width: screenRect.width,
        height: screenRect.height,
      })
    }

    if (!iphoneFocused) return

    const elapsed = clock.elapsedTime
    const interval = interactive
      ? CAPTURE_INTERVAL_INTERACTIVE_S
      : CAPTURE_INTERVAL_S
    const sinceLast = elapsed - lastCapture.current
    if (sinceLast < interval && !pendingCapture.current) return

    runCapture(elapsed)
  })

  return null
}
