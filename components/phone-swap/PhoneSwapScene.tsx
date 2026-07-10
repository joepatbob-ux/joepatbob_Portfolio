import { OrbitControls, TransformControls, useCursor } from '@react-three/drei'
import { useFrame, useLoader, useThree } from '@react-three/fiber'
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type Ref,
  type RefObject,
  type MutableRefObject,
} from 'react'
import * as THREE from 'three'
import { DataTexture, NoColorSpace, RGBAFormat, SRGBColorSpace, TextureLoader, UnsignedByteType } from 'three'
import type { ThreeEvent } from '@react-three/fiber'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'
import {
  backDeviceFromSnapshot,
} from '@/lib/phone-swap/phoneDeviceRoles'
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
import {
  cameraViewFittingPhones,
  cameraViewZoomAllOut,
  PHONE_VIEWPORT_DISTANCE_SCALE,
  PHONE_VIEWPORT_FIT_MARGIN,
  PHONE_VIEWPORT_FOV_TRIM,
} from '@/lib/phone-swap/phoneSwapCameraFit'
import {
  applyFocusToPhoneRoot,
  focusForSnapshot,
} from '@/lib/phone-swap/phoneFocusVisuals'
import { PHONE_HOVER } from '@/lib/phone-swap/phoneAccentHover'
import {
  applyPhoneMaterialTunes,
  EMPTY_PHONE_MATERIAL_TUNES,
  type PhoneMaterialTunesByDevice,
} from '@/lib/phone-swap/phoneMaterialTune'
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
import { PhoneScreenshotTextureBinder } from '@/components/phone-swap/PhoneScreenshotTextureBinder'
import { SmaIPhoneLiveScreen } from '@/components/sma-ios26/SmaIPhoneLiveScreen'
import type { DisplayScreenRect } from '@/lib/sma-ios26/displayScreenRect'
import { usePixel8SceneGraph } from '@/lib/phone-swap/usePixel8SceneGraph'
import { useGlb } from '@/lib/phone-swap/useGlb'

const BLACK_SCREEN = new DataTexture(new Uint8Array([0, 0, 0, 255]), 1, 1, RGBAFormat, UnsignedByteType)
BLACK_SCREEN.needsUpdate = true

type GizmoMode = 'translate' | 'rotate' | 'scale'

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t
}

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
  onSwapRequest?: () => void
  onBackHoverChange?: (hovering: boolean) => void
  showGuides?: boolean
  viewLocked?: boolean
  sceneApiRef?: RefObject<PhoneSwapSceneApi | null>
  materialTunes?: PhoneMaterialTunesByDevice
  /** Mount interactive SMA proto on the iPhone display. */
  iphoneLiveScreen?: boolean
  /** iPhone is the front / focused phone (from PhoneSwap swap state). */
  iphoneFocused?: boolean
  onLiveScreenRect?: (rect: DisplayScreenRect | null) => void
  /** Live CSS-driven viewport fit (read from .phone-swap__viewbox custom properties). */
  viewportFitRef?: MutableRefObject<{
    margin: number
    distanceScale: number
  }>
  androidScreenUrl?: string
  iphoneScreenUrl?: string
}

function usePixel8Scene() {
  return usePixel8SceneGraph().scene
}

function useIPhoneScene() {
  const { invalidate } = useThree()
  const urls = PHONE_SWAP_URLS.iphone16
  const raw = useGlb(urls.glb)

  // Excludes the two brush normal maps (~5 MB combined as WebP) so the scene
  // can suspend and appear without waiting for surface-detail textures.
  const criticalTextures = useLoader(TextureLoader, [
    urls.flash,
    urls.screwGrooves,
    urls.frontCamera,
    urls.speakerAlpha,
    urls.speakerBump,
  ])

  useLayoutEffect(() => {
    criticalTextures.forEach((tex: THREE.Texture) => {
      tex.colorSpace = SRGBColorSpace
      tex.needsUpdate = true
    })
  }, [criticalTextures])

  const scene = useMemo(() => {
    const [flash, screwGrooves, frontCamera, speakerAlpha, speakerBump] = criticalTextures
    // Neutral tangent-space normal (pointing straight up) — renders as flat
    // metal until the real brush normal maps arrive via the effect below.
    const placeholderNormal = new THREE.DataTexture(new Uint8Array([128, 128, 255, 255]), 1, 1)
    placeholderNormal.colorSpace = NoColorSpace
    placeholderNormal.needsUpdate = true
    return prepareIPhone16Scene(
      raw,
      {
        brushNormalRough: placeholderNormal,
        brushNormalSatin: placeholderNormal,
        flash,
        screwGrooves,
        frontCamera,
        speakerAlpha,
        speakerBump,
      },
      BLACK_SCREEN,
    ).scene
  }, [raw, criticalTextures])

  // Load brush normal maps after the scene is visible, then patch materials.
  useEffect(() => {
    const loader = new TextureLoader()
    let cancelled = false
    Promise.all([
      loader.loadAsync(urls.brushNormalRough),
      loader.loadAsync(urls.brushNormalSatin),
    ]).then(([rough, satin]) => {
      if (cancelled) return
      rough.colorSpace = NoColorSpace
      rough.needsUpdate = true
      satin.colorSpace = NoColorSpace
      satin.needsUpdate = true
      scene.traverse((child: THREE.Object3D) => {
        if (!(child instanceof THREE.Mesh)) return
        const mat = child.material
        if (!(mat instanceof THREE.MeshStandardMaterial)) return
        if (mat.name === 'TITANIUM Rough') {
          mat.normalMap = rough
          mat.needsUpdate = true
        } else if (mat.name === 'TITANIUM Satin') {
          mat.normalMap = satin
          mat.needsUpdate = true
        }
      })
      invalidate()
    })
    return () => {
      cancelled = true
    }
  }, [scene, urls.brushNormalRough, urls.brushNormalSatin, invalidate])

  return scene
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
  onSwapRequest,
  onBackHoverChange,
  showGuides = false,
  viewLocked = true,
  sceneApiRef,
  materialTunes = EMPTY_PHONE_MATERIAL_TUNES,
  iphoneLiveScreen = false,
  iphoneFocused = false,
  onLiveScreenRect,
  viewportFitRef,
  androidScreenUrl,
  iphoneScreenUrl,
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
  const backDeviceRef = useRef<PhoneDevice>('iphone')
  const hoverBackRef = useRef(false)
  const hoverSmoothRef = useRef(0)
  /** Back phone + peak glow when a swap starts — keeps orange through the animation. */
  const swapGlowDeviceRef = useRef<PhoneDevice | null>(null)
  const swapGlowPeakRef = useRef(0)
  const [hoverBack, setHoverBack] = useState(false)
  const [backDevice, setBackDevice] = useState<PhoneDevice>('iphone')
  const materialTunesRef = useRef(materialTunes)
  materialTunesRef.current = materialTunes
  const fittedViewRef = useRef<PhoneCameraView | null>(null)
  const hasAndroidMaterialTunes = Object.keys(materialTunes.android).length > 0
  const hasIphoneMaterialTunes = Object.keys(materialTunes.iphone).length > 0

  const interactionEnabled = !layoutMode && !animating
  useCursor(interactionEnabled && hoverBack)

  const onSwapRef = useRef(onSwapRequest)
  onSwapRef.current = onSwapRequest
  const onHoverRef = useRef(onBackHoverChange)
  onHoverRef.current = onBackHoverChange

  const setBackHover = useCallback((next: boolean) => {
    hoverBackRef.current = next
    setHoverBack(next)
    onHoverRef.current?.(next)
  }, [])

  const handlePhoneClick = useCallback(
    (device: PhoneDevice) => (e: ThreeEvent<MouseEvent>) => {
      if (!interactionEnabled) return
      e.stopPropagation()
      if (backDeviceRef.current !== device) return
      onSwapRef.current?.()
    },
    [interactionEnabled],
  )

  const handlePhonePointerDown = useCallback(
    (device: PhoneDevice) => (e: ThreeEvent<PointerEvent>) => {
      if (!interactionEnabled) return
      if (e.pointerType !== 'touch' && e.pointerType !== 'pen') return
      e.stopPropagation()
      if (backDeviceRef.current !== device) return
      onSwapRef.current?.()
    },
    [interactionEnabled],
  )

  const handlePhoneOver = useCallback(
    (device: PhoneDevice) => (e: ThreeEvent<PointerEvent>) => {
      if (!interactionEnabled) return
      e.stopPropagation()
      if (backDeviceRef.current !== device) {
        setBackHover(false)
        return
      }
      setBackHover(true)
    },
    [interactionEnabled, setBackHover],
  )

  const handlePhoneOut = useCallback(
    (device: PhoneDevice) => (e: ThreeEvent<PointerEvent>) => {
      if (backDeviceRef.current !== device) return
      e.stopPropagation()
      setBackHover(false)
    },
    [setBackHover],
  )

  const cameraView = layout.camera
  const orbitAllowed = layoutMode && !viewLocked
  const layoutSnapshot =
    liveSnapshot ?? layoutSnapshotForEdit(layout, editFocus)

  useLayoutEffect(() => {
    if (!sceneApiRef) return
    const apiSlot = sceneApiRef as MutableRefObject<PhoneSwapSceneApi | null>
    apiSlot.current = {
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
      apiSlot.current = null
    }
  }, [camera, sceneApiRef, cameraView, androidRef, iphoneRef])

  useLayoutEffect(() => {
    if (!layoutMode) return
    applyCameraView(camera, controlsRef.current, cameraView)
  }, [camera, cameraView, layoutMode])

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

  useLayoutEffect(() => {
    applyPhoneMaterialTunes(
      androidRef.current,
      materialTunes.android,
      'android',
    )
    applyPhoneMaterialTunes(
      iphoneRef.current,
      materialTunes.iphone,
      'iphone',
    )
  }, [materialTunes, androidRef, iphoneRef, androidScene, iphoneScene])

  const runSwapTimeline = !layoutMode || animating

  useFrame(() => {
    let animLinear = 0

    if (runSwapTimeline) {
      if (animating) {
        animLinear = Math.min(
          1,
          (performance.now() - animStart.current) / animSettings.durationMs,
        )
        if (animLinear >= 1) {
          progressRef.current = animTo.current
          if (!animCompleteFired.current) {
            animCompleteFired.current = true
            queueMicrotask(() => onCompleteRef.current?.())
          }
        } else {
          progressRef.current =
            animFrom.current + (animTo.current - animFrom.current) * animLinear
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
      const back = backDeviceFromSnapshot(snapshot)
      backDeviceRef.current = back
      if (back !== backDevice) setBackDevice(back)

      const swapGlowActive =
        animating && swapGlowDeviceRef.current !== null && swapGlowPeakRef.current > 0.01

      if (swapGlowActive) {
        const fade = Math.min(1, animLinear / PHONE_HOVER.swapGlowFadeEnd)
        hoverSmoothRef.current = swapGlowPeakRef.current * (1 - fade)
      } else {
        const glowTarget =
          interactionEnabled && hoverBackRef.current ? 1 : 0
        hoverSmoothRef.current = lerp(
          hoverSmoothRef.current,
          glowTarget,
          PHONE_HOVER.hoverLerp,
        )
      }
      const backHover = hoverSmoothRef.current

      const glowDevice = swapGlowDeviceRef.current ?? back

      applyPoseToGroup(androidRef.current, snapshot.android)
      applyPoseToGroup(iphoneRef.current, snapshot.iphone)

      if (settled || backHover > 0.01) {
        applyFocusToPhoneRoot(
          androidRef.current,
          focusForSnapshot(snapshot, 'android'),
          !settled,
          { glowStrength: glowDevice === 'android' ? backHover : 0 },
        )
        applyFocusToPhoneRoot(
          iphoneRef.current,
          focusForSnapshot(snapshot, 'iphone'),
          !settled,
          { glowStrength: glowDevice === 'iphone' ? backHover : 0 },
        )
      }
    }

    if (hasAndroidMaterialTunes) {
      applyPhoneMaterialTunes(
        androidRef.current,
        materialTunesRef.current.android,
        'android',
      )
    }
    if (hasIphoneMaterialTunes) {
      applyPhoneMaterialTunes(
        iphoneRef.current,
        materialTunesRef.current.iphone,
        'iphone',
      )
    }

    const lockCamera = layoutMode ? viewLocked : true
    if (lockCamera) {
      const aspect =
        camera instanceof THREE.PerspectiveCamera ? camera.aspect : 1
      const activeCamera = layoutMode
        ? cameraView
        : animating
          ? cameraViewForSwap(
              fittedViewRef.current ?? cameraView,
              progressRef.current,
              true,
              androidRef.current,
              iphoneRef.current,
              aspect,
            )
          : (() => {
              const frontRoot =
                backDeviceRef.current === 'android'
                  ? iphoneRef.current
                  : androidRef.current
              const fitted = cameraViewFittingPhones(
                cameraView,
                androidRef.current,
                iphoneRef.current,
                aspect,
                viewportFitRef?.current.margin ?? PHONE_VIEWPORT_FIT_MARGIN,
                'viewport',
                viewportFitRef?.current.distanceScale ??
                  PHONE_VIEWPORT_DISTANCE_SCALE,
                PHONE_VIEWPORT_FOV_TRIM,
                frontRoot,
              )
              if (fitted) fittedViewRef.current = fitted
              return fittedViewRef.current
            })()
      if (activeCamera) {
        applyCameraView(camera, controlsRef.current, activeCamera)
      }
    }
  })

  useEffect(() => {
    if (layoutMode) setBackHover(false)
  }, [layoutMode, setBackHover])

  useLayoutEffect(() => {
    if (!animating) {
      swapGlowDeviceRef.current = null
      swapGlowPeakRef.current = 0
      return
    }

    swapGlowDeviceRef.current = backDeviceRef.current
    swapGlowPeakRef.current = Math.max(
      hoverSmoothRef.current,
      hoverBackRef.current ? 1 : 0,
    )
    setBackHover(false)
  }, [animating, animSession, setBackHover])

  return (
    <>
      {layoutMode && showGuides ? <PhoneLayoutSceneGuides /> : null}
      <ambientLight intensity={0.85} />
      <directionalLight position={[5, 8, 6]} intensity={1.5} />
      <directionalLight position={[-4, 2, -4]} intensity={0.45} />
      <hemisphereLight args={['#f0f0f4', '#404048', 0.35]} />
      <group
        ref={androidRef as Ref<THREE.Group>}
        onClick={handlePhoneClick('android')}
        onPointerDown={handlePhonePointerDown('android')}
        onPointerOver={handlePhoneOver('android')}
        onPointerOut={handlePhoneOut('android')}
      >
        <primitive object={androidScene} frustumCulled={false} />
      </group>
      <group
        ref={iphoneRef as Ref<THREE.Group>}
        onClick={handlePhoneClick('iphone')}
        onPointerDown={handlePhonePointerDown('iphone')}
        onPointerOver={handlePhoneOver('iphone')}
        onPointerOut={handlePhoneOut('iphone')}
      >
        <primitive object={iphoneScene} frustumCulled={false} />
      </group>
      {androidScreenUrl && iphoneScreenUrl ? (
        <PhoneScreenshotTextureBinder
          androidScreenUrl={androidScreenUrl}
          iphoneScreenUrl={iphoneScreenUrl}
          androidRef={androidRef}
          iphoneRef={iphoneRef}
          androidScene={androidScene}
          iphoneScene={iphoneScene}
        />
      ) : null}
      {iphoneLiveScreen ? (
        <SmaIPhoneLiveScreen
          scene={iphoneScene}
          iphoneFocused={iphoneFocused}
          interactive={interactionEnabled && iphoneFocused}
          onScreenRect={onLiveScreenRect}
        />
      ) : null}
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