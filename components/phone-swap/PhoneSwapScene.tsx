'use client'

import { OrbitControls, TransformControls } from '@react-three/drei'
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
import {
  applyPoseToGroup,
  readPoseFromGroup,
  snapshotForProgress,
} from '@/lib/phone-swap/phoneSwapAnimation'
import {
  DEFAULT_PHONE_SWAP_ANIM,
  type PhoneSwapAnimSettings,
} from '@/lib/phone-swap/phoneSwapAnimSettings'
import {
  applyCameraView,
  cameraViewForSwap,
  readCameraView,
  type PhoneCameraView,
} from '@/lib/phone-swap/phoneSwapCamera'
import { cameraViewZoomAllOut } from '@/lib/phone-swap/phoneSwapCameraFit'
import {
  applyFocusToPhoneRoot,
  focusForSnapshot,
} from '@/lib/phone-swap/phoneFocusVisuals'
import {
  type PhoneDevice,
  layoutSnapshotForEdit,
  type PhoneSwapEditFocus,
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
  zoomAllOut: () => PhoneCameraView | null
}

interface Props {
  layout: PhoneSwapLayout
  /** 0 = Android focus, 1 = iPhone focus */
  swapProgress: number
  layoutMode?: boolean
  editFocus?: PhoneSwapEditFocus
  liveSnapshot?: PhoneSwapSnapshot
  onGizmoChange?: () => void
  selectedDevice?: PhoneDevice
  gizmoMode?: GizmoMode
  androidRef?: RefObject<THREE.Group | null>
  iphoneRef?: RefObject<THREE.Group | null>
  animating?: boolean
  /** Bumped on each swap trigger so preview can restart the timeline. */
  animSession?: number
  animSettings?: PhoneSwapAnimSettings
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
  animSession = 0,
  animSettings = DEFAULT_PHONE_SWAP_ANIM,
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
  const layoutSnapshot =
    liveSnapshot ?? layoutSnapshotForEdit(layout, editFocus)

  useLayoutEffect(() => {
    if (!sceneApiRef) return
    sceneApiRef.current = {
      saveCameraView: () => readCameraView(camera, controlsRef.current),
      zoomAllOut: () => {
        if (!(camera instanceof THREE.PerspectiveCamera)) return null
        const view = cameraViewZoomAllOut(
          cameraView,
          androidRef.current,
          iphoneRef.current,
          camera.aspect,
        )
        applyCameraView(camera, controlsRef.current, view)
        return readCameraView(camera, controlsRef.current)
      },
    }
    return () => {
      sceneApiRef.current = null
    }
  }, [camera, sceneApiRef, cameraView, androidRef, iphoneRef])

  useLayoutEffect(() => {
    applyCameraView(camera, controlsRef.current, cameraView)
  }, [camera, cameraView])

  useLayoutEffect(() => {
    targetProgress.current = swapProgress
  }, [swapProgress])

  useLayoutEffect(() => {
    if (!animating) return
    animFrom.current = progressRef.current
    animTo.current = swapProgress
    animStart.current = performance.now()
    animCompleteFired.current = false
  }, [animating, swapProgress, animSession])

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
    if (!layoutMode || animating || gizmoDragging.current) return
    applyPoseToGroup(androidRef.current, layoutSnapshot.android)
    applyPoseToGroup(iphoneRef.current, layoutSnapshot.iphone)
    applyFocusToPhoneRoot(androidRef.current, 1)
    applyFocusToPhoneRoot(iphoneRef.current, 1)
  }, [layoutMode, animating, layoutSnapshot, androidRef, iphoneRef])

  const runSwapTimeline = !layoutMode || animating

  useFrame(() => {
    if (runSwapTimeline) {
      if (animating) {
        const linear =
          (performance.now() - animStart.current) / animSettings.durationMs
        if (linear >= 1) {
          progressRef.current = animTo.current
          if (!animCompleteFired.current) {
            animCompleteFired.current = true
            queueMicrotask(() => onCompleteRef.current?.())
          }
        } else {
          progressRef.current =
            animFrom.current + (animTo.current - animFrom.current) * linear
        }
      } else {
        progressRef.current = targetProgress.current
      }

      const forward = animating
        ? animTo.current >= animFrom.current
        : true
      const snapshot = snapshotForProgress(
        layout,
        progressRef.current,
        forward,
        animSettings,
      )
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
    }

    const lockCamera = layoutMode ? viewLocked : true
    if (lockCamera) {
      const aspect =
        camera instanceof THREE.PerspectiveCamera ? camera.aspect : 1
      const activeCamera = layoutMode
        ? cameraView
        : cameraViewForSwap(
            cameraView,
            progressRef.current,
            animating,
            androidRef.current,
            iphoneRef.current,
            aspect,
          )
      applyCameraView(camera, controlsRef.current, activeCamera)
    }
  })

  return (
    <>
      {layoutMode && showGuides ? <PhoneLayoutSceneGuides /> : null}
      <ambientLight intensity={0.85} />
      <directionalLight position={[5, 8, 6]} intensity={1.5} />
      <directionalLight position={[-4, 2, -4]} intensity={0.45} />
      <hemisphereLight args={['#f0f0f4', '#404048', 0.35]} />
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