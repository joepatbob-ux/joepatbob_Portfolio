'use client'

import { Environment, OrbitControls, TransformControls } from '@react-three/drei'
import { useFrame, useLoader, useThree } from '@react-three/fiber'
import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type RefObject,
} from 'react'
import * as THREE from 'three'
import { NoColorSpace, SRGBColorSpace, TextureLoader } from 'three'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'
import { debugLog } from '@/lib/phone-swap/debugLog'
import { PHONE_SWAP_ANIM_MS, easeInOutSine } from '@/lib/phone-swap/phoneSwapTiming'
import {
  applyPoseToGroup,
  readPoseFromGroup,
  snapshotForProgress,
} from '@/lib/phone-swap/phoneSwapAnimation'
import {
  applyCameraView,
  readCameraView,
  type PhoneCameraView,
} from '@/lib/phone-swap/phoneSwapCamera'
import {
  applyFocusToPhoneRoot,
  focusForSnapshot,
} from '@/lib/phone-swap/phoneFocusVisuals'
import {
  type PhoneDevice,
  type PhoneSwapFocus,
  type PhoneSwapLayout,
  type PhoneSwapSnapshot,
} from '@/lib/phone-swap/phoneSwapLayout'
import { PHONE_SWAP_URLS } from '@/lib/phone-swap/phoneSwapUrls'
import { prepareIPhone16Scene } from '@/lib/phone-swap/prepareIPhone16Scene'
import { PhoneLayoutSceneGuides } from '@/components/phone-swap/PhoneLayoutSceneGuides'
import { usePixel8SceneGraph } from '@/lib/phone-swap/usePixel8SceneGraph'
import { useObjMtl } from '@/lib/phone-swap/useObjMtl'

type GizmoMode = 'translate' | 'rotate' | 'scale'

export type PhoneSwapSceneApi = {
  saveCameraView: () => PhoneCameraView
}

interface Props {
  layout: PhoneSwapLayout
  /** 0 = Android focus, 1 = iPhone focus */
  swapProgress: number
  layoutMode?: boolean
  editFocus?: PhoneSwapFocus
  liveSnapshot?: PhoneSwapSnapshot
  onGizmoChange?: () => void
  selectedDevice?: PhoneDevice
  gizmoMode?: GizmoMode
  androidRef?: RefObject<THREE.Group | null>
  iphoneRef?: RefObject<THREE.Group | null>
  animating?: boolean
  onAnimationComplete?: () => void
  showGuides?: boolean
  viewLocked?: boolean
  sceneApiRef?: RefObject<PhoneSwapSceneApi | null>
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

export function PhoneSwapScene({
  layout,
  swapProgress,
  layoutMode = false,
  editFocus = 'androidFocus',
  liveSnapshot,
  onGizmoChange,
  selectedDevice = 'android',
  gizmoMode = 'translate',
  androidRef: androidRefProp,
  iphoneRef: iphoneRefProp,
  animating = false,
  onAnimationComplete,
  showGuides = false,
  viewLocked = true,
  sceneApiRef,
}: Props) {
  const { camera } = useThree()
  const androidScene = usePixel8Scene()
  const iphoneScene = useIPhoneScene()
  const androidRefLocal = useRef<THREE.Group>(null)
  const iphoneRefLocal = useRef<THREE.Group>(null)
  const androidRef = androidRefProp ?? androidRefLocal
  const iphoneRef = iphoneRefProp ?? iphoneRefLocal
  const controlsRef = useRef<OrbitControlsImpl>(null)
  const progressRef = useRef(swapProgress)
  const targetProgress = useRef(swapProgress)
  const animFrom = useRef(swapProgress)
  const animTo = useRef(swapProgress)
  const animStart = useRef(0)
  const animCompleteFired = useRef(false)
  const onCompleteRef = useRef(onAnimationComplete)
  onCompleteRef.current = onAnimationComplete
  const [orbitEnabled, setOrbitEnabled] = useState(true)
  const [gizmoTarget, setGizmoTarget] = useState<THREE.Object3D | null>(null)
  const gizmoDragging = useRef(false)

  const cameraView = layout.camera
  const orbitAllowed = layoutMode && !viewLocked
  const layoutSnapshot = liveSnapshot ?? layout[editFocus]

  useLayoutEffect(() => {
    if (!sceneApiRef) return
    sceneApiRef.current = {
      saveCameraView: () => readCameraView(camera, controlsRef.current),
    }
    return () => {
      sceneApiRef.current = null
    }
  }, [camera, sceneApiRef])

  useLayoutEffect(() => {
    applyCameraView(camera, controlsRef.current, cameraView)
  }, [camera, cameraView])

  useEffect(() => {
    targetProgress.current = swapProgress
  }, [swapProgress])

  useEffect(() => {
    if (!animating) return
    animFrom.current = progressRef.current
    animTo.current = targetProgress.current
    animStart.current = performance.now()
    animCompleteFired.current = false
  }, [animating, swapProgress])

  useEffect(() => {
    debugLog(
      'PhoneSwapScene.tsx:mount',
      'dual phone swap scene',
      { swapProgress, layoutMode, viewLocked },
      'C',
      'post-fix',
    )
  }, [swapProgress, layoutMode, viewLocked])

  useLayoutEffect(() => {
    if (!layoutMode) {
      setGizmoTarget(null)
      return
    }
    const target =
      selectedDevice === 'android' ? androidRef.current : iphoneRef.current
    setGizmoTarget(target)
  }, [layoutMode, selectedDevice, editFocus, androidRef, iphoneRef])

  useLayoutEffect(() => {
    if (!layoutMode || gizmoDragging.current) return
    applyPoseToGroup(androidRef.current, layoutSnapshot.android)
    applyPoseToGroup(iphoneRef.current, layoutSnapshot.iphone)
    applyFocusToPhoneRoot(androidRef.current, 1)
    applyFocusToPhoneRoot(iphoneRef.current, 1)
  }, [layoutMode, layoutSnapshot, androidRef, iphoneRef])

  useFrame(() => {
    if (!layoutMode || viewLocked) {
      applyCameraView(camera, controlsRef.current, cameraView)
    }

    if (layoutMode) return

    if (animating) {
      const linear = (performance.now() - animStart.current) / PHONE_SWAP_ANIM_MS
      if (linear >= 1) {
        progressRef.current = animTo.current
        if (!animCompleteFired.current) {
          animCompleteFired.current = true
          queueMicrotask(() => onCompleteRef.current?.())
        }
      } else {
        const u = easeInOutSine(linear)
        progressRef.current =
          animFrom.current + (animTo.current - animFrom.current) * u
      }
    } else {
      progressRef.current = targetProgress.current
    }

    const snapshot = snapshotForProgress(layout, progressRef.current)
    const settled = !animating

    applyPoseToGroup(androidRef.current, snapshot.android)
    applyPoseToGroup(iphoneRef.current, snapshot.iphone)
    applyFocusToPhoneRoot(
      androidRef.current,
      focusForSnapshot(snapshot, 'android'),
      settled,
    )
    applyFocusToPhoneRoot(
      iphoneRef.current,
      focusForSnapshot(snapshot, 'iphone'),
      settled,
    )
  })

  return (
    <>
      <Environment preset="city" />
      {layoutMode && showGuides ? <PhoneLayoutSceneGuides /> : null}
      <ambientLight intensity={0.75} />
      <directionalLight position={[5, 8, 6]} intensity={1.4} />
      <directionalLight position={[-4, 2, -4]} intensity={0.4} />
      <group ref={androidRef}>
        <primitive object={androidScene} frustumCulled={false} />
      </group>
      <group ref={iphoneRef}>
        <primitive object={iphoneScene} frustumCulled={false} />
      </group>
      {layoutMode && gizmoTarget ? (
        <TransformControls
          object={gizmoTarget}
          mode={gizmoMode}
          onMouseDown={() => {
            gizmoDragging.current = true
            setOrbitEnabled(false)
          }}
          onMouseUp={() => {
            gizmoDragging.current = false
            setOrbitEnabled(true)
            onGizmoChange?.()
          }}
          onObjectChange={() => onGizmoChange?.()}
        />
      ) : null}
      <OrbitControls
        ref={controlsRef}
        makeDefault
        enablePan={false}
        enabled={orbitAllowed && orbitEnabled}
        target={cameraView.target}
      />
    </>
  )
}