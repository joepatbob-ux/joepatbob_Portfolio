import { PhoneScreenshotControls } from '@/components/phone-swap/PhoneScreenshotControls'
import { PhoneSwapScene } from '@/components/phone-swap/PhoneSwapScene'
import { PhoneSwapGooLoader } from '@/components/phone-swap/PhoneSwapGooLoader'
import { StageSceneReady } from '@/components/stage/StageSceneReady'
import { SmaPhoneScreenOverlay } from '@/components/sma-ios26/SmaPhoneScreenOverlay'
import type { DisplayScreenRect } from '@/lib/sma-ios26/displayScreenRect'
import { Canvas } from '@react-three/fiber'
import {
  PHONE_SWAP_LAYOUT,
  cloneLayout,
  layoutSnapshotForEdit,
} from '@/lib/phone-swap/phoneSwapLayout'
import {
  clampAnimSettings,
  DEFAULT_PHONE_SWAP_ANIM,
} from '@/lib/phone-swap/phoneSwapAnimSettings'
import {
  PHONE_VIEWPORT_DISTANCE_SCALE,
  PHONE_VIEWPORT_FIT_MARGIN,
} from '@/lib/phone-swap/phoneSwapCameraFit'
import { PHONE_MODEL_TARGET_MAX } from '@/lib/phone-swap/normalizeModel'
import { EMPTY_PHONE_MATERIAL_TUNES } from '@/lib/phone-swap/phoneMaterialTune'
import { useChapterActive } from '@/lib/chapterActiveContext'
import { usePhoneScreenshotControls } from '@/lib/phone-swap/usePhoneScreenshotControls'
import { usePhoneSwapTouchScroll } from '@/lib/phone-swap/usePhoneSwapTouchScroll'
import { useLayoutTopBarNav } from '@/lib/hooks/useLayoutTopBarNav'
import { useHydrated } from '@/lib/hooks/useHydrated'
import { isPrerenderSnapshot } from '@/lib/isPrerenderSnapshot'
import type { PhoneSwapSceneApi } from '@/components/phone-swap/PhoneSwapScene'
import {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import type * as THREE from 'three'

/** Minimum time the goo loader stays up so it never flashes on fast loads. */
const MIN_LOADER_MS = 900
/** Extra hold after the scene commits, so the phone's camera-fit settles before
 *  the loader lifts (otherwise the phone visibly jumps into its final framing). */
const SETTLE_AFTER_READY_MS = 700

/** 3D Pixel / iPhone swap — tap back phone to swap. */
export function PhoneSwap({ liveScreen = false }: { liveScreen?: boolean }) {
  const hydrated = useHydrated()
  const [swapped, setSwapped] = useState(false)
  const [animating, setAnimating] = useState(false)
  const layout = useMemo(() => cloneLayout(PHONE_SWAP_LAYOUT), [])
  const liveSnapshot = useMemo(
    () => layoutSnapshotForEdit(layout, 'androidFocus'),
    [layout],
  )
  const topBarNav = useLayoutTopBarNav()
  const chapterActive = useChapterActive()
  const screenshot = usePhoneScreenshotControls({ animating })
  const resetTimerRef = useRef(screenshot.resetTimer)
  resetTimerRef.current = screenshot.resetTimer
  const sceneLatchedRef = useRef(false)
  if (chapterActive) {
    sceneLatchedRef.current = true
  }
  const viewboxRef = useRef<HTMLDivElement>(null)
  const [animSession, setAnimSession] = useState(0)
  const [backPhoneHover, setBackPhoneHover] = useState(false)
  const [liveScreenRect, setLiveScreenRect] = useState<DisplayScreenRect | null>(null)
  const handleLiveScreenRect = useCallback((rect: DisplayScreenRect | null) => {
    setLiveScreenRect(rect)
  }, [])
  const iphoneLiveScreen = useMemo(() => {
    if (liveScreen) return true
    if (typeof window === 'undefined') return false
    return new URLSearchParams(window.location.search).has('sma-live')
  }, [liveScreen])
  const busy = useRef(false)
  const androidRef = useRef<THREE.Group>(null)
  const iphoneRef = useRef<THREE.Group>(null)
  const sceneApiRef = useRef<PhoneSwapSceneApi | null>(null)

  // Goo loader: hold it a minimum time so it never just flashes on fast loads,
  // then fade out once the scene has committed AND the minimum has elapsed.
  const [loaderHidden, setLoaderHidden] = useState(false)
  const [loaderGone, setLoaderGone] = useState(false)
  const loaderShownAtRef = useRef<number | null>(null)
  const handleSceneReady = useCallback(() => {
    const shownAt = loaderShownAtRef.current ?? performance.now()
    const remaining = Math.max(
      SETTLE_AFTER_READY_MS,
      MIN_LOADER_MS - (performance.now() - shownAt),
    )
    window.setTimeout(() => setLoaderHidden(true), remaining)
  }, [])

  const swapProgress = swapped ? 1 : 0

  const handleAnimationComplete = useCallback(() => {
    busy.current = false
    setAnimating(false)
    resetTimerRef.current()
  }, [])

  const triggerSwap = useCallback(() => {
    if (busy.current) return
    busy.current = true
    setSwapped((s) => !s)
    setAnimSession((n) => n + 1)
    setAnimating(true)
  }, [])

  const doSwap = useCallback(() => {
    if (busy.current) return
    triggerSwap()
  }, [triggerSwap])

  const inFlowChapter = topBarNav
  const shouldRenderScene = sceneLatchedRef.current
  const runSceneLoop = chapterActive
  const useScrollPassthrough = inFlowChapter
  const invalidateCanvasRef = useRef<(() => void) | null>(null)
  const viewportFitRef = useRef({
    margin: PHONE_VIEWPORT_FIT_MARGIN,
    distanceScale: PHONE_VIEWPORT_DISTANCE_SCALE,
  })

  usePhoneSwapTouchScroll(viewboxRef, useScrollPassthrough, doSwap)

  useEffect(() => {
    if (!shouldRenderScene) return
    const el = viewboxRef.current
    if (!el) return

    const syncViewportFit = () => {
      const styles = getComputedStyle(el)
      let margin = parseFloat(styles.getPropertyValue('--phone-viewport-fit-margin'))
      let distanceScale = parseFloat(
        styles.getPropertyValue('--phone-viewport-distance-scale'),
      )
      if (!Number.isFinite(margin) || margin <= 0) {
        const host = el.closest('.mobile-chapter-slot--sensi')
        if (host) {
          const hostStyles = getComputedStyle(host)
          margin = parseFloat(hostStyles.getPropertyValue('--phone-viewport-fit-margin'))
          distanceScale = parseFloat(
            hostStyles.getPropertyValue('--phone-viewport-distance-scale'),
          )
        }
      }
      viewportFitRef.current = {
        margin:
          Number.isFinite(margin) && margin > 0
            ? margin
            : PHONE_VIEWPORT_FIT_MARGIN,
        distanceScale:
          Number.isFinite(distanceScale) && distanceScale > 0
            ? distanceScale
            : PHONE_VIEWPORT_DISTANCE_SCALE,
      }
      invalidateCanvasRef.current?.()
    }

    let fitRaf = 0
    const scheduleViewportFit = () => {
      cancelAnimationFrame(fitRaf)
      fitRaf = requestAnimationFrame(syncViewportFit)
    }

    const ro = new ResizeObserver((entries) => {
      const entry = entries[0]
      if (!entry) return
      const { width, height } = entry.contentRect
      if (width < 48 || height < 48) return
      scheduleViewportFit()
    })
    ro.observe(el)
    syncViewportFit()
    return () => {
      cancelAnimationFrame(fitRaf)
      ro.disconnect()
    }
  }, [shouldRenderScene])

  // Stamp when the goo loader first appears (scene mounts) so handleSceneReady
  // can enforce the minimum-visible window. Arm a hard fallback so the opaque
  // overlay always releases even if the scene never signals ready.
  useEffect(() => {
    if (!shouldRenderScene || loaderShownAtRef.current != null) return
    loaderShownAtRef.current = performance.now()
    const safety = window.setTimeout(() => setLoaderHidden(true), 8000)
    return () => window.clearTimeout(safety)
  }, [shouldRenderScene])

  // Unmount the loader (stopping its rAF) once the fade-out has finished.
  useEffect(() => {
    if (!loaderHidden) return
    const t = window.setTimeout(() => setLoaderGone(true), 320)
    return () => window.clearTimeout(t)
  }, [loaderHidden])

  if (isPrerenderSnapshot() || !hydrated) {
    return null
  }

  return (
    <div
      className={`phone-swap${inFlowChapter ? ' phone-swap--mobile-bleed phone-swap--in-flow' : ''}`}
    >
      {iphoneLiveScreen ? (
        <SmaPhoneScreenOverlay
          rect={liveScreenRect}
          visible={swapped}
          interactive={swapped && !animating}
        />
      ) : null}

      <div
        ref={viewboxRef}
        className={`phone-swap__viewbox${backPhoneHover ? ' phone-swap__viewbox--swap-target' : ''}${swapped && iphoneLiveScreen && !animating ? ' phone-swap__viewbox--live-interactive' : ''}`}
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key !== 'Enter' && e.key !== ' ') return
          e.preventDefault()
          doSwap()
        }}
        role="img"
        aria-label={
          swapped
            ? 'Phone models: iPhone in front showing the Sensi app. Tap the Android in back to swap.'
            : 'Phone models: Android in front showing the Sensi app. Tap the iPhone in back to swap.'
        }
      >
        {shouldRenderScene ? (
          <Canvas
            key={`phone-swap-${PHONE_MODEL_TARGET_MAX}`}
            camera={{
              position: layout.camera.position,
              fov: layout.camera.fov,
              near: 0.05,
              far: 50,
            }}
            style={{ width: '100%', height: '100%', background: 'transparent' }}
            gl={{
              alpha: true,
              antialias: true,
              powerPreference: 'high-performance',
              logarithmicDepthBuffer: true,
            }}
            dpr={[1, 2]}
            frameloop={runSceneLoop ? 'always' : 'demand'}
            onCreated={({ gl, invalidate }) => {
              gl.setClearColor(0x000000, 0)
              invalidateCanvasRef.current = invalidate
            }}
          >
            <Suspense fallback={null}>
              <StageSceneReady onReady={handleSceneReady}>
                <PhoneSwapScene
                layout={layout}
                swapProgress={swapProgress}
                layoutMode={false}
                editFocus="androidFocus"
                liveSnapshot={liveSnapshot}
                onGizmoChange={() => {}}
                selectedDevice="android"
                gizmoMode="translate"
                androidRef={androidRef}
                iphoneRef={iphoneRef}
                animating={animating}
                animSession={animSession}
                animSettings={clampAnimSettings(DEFAULT_PHONE_SWAP_ANIM)}
                onAnimationComplete={handleAnimationComplete}
                onSwapRequest={triggerSwap}
                onBackHoverChange={setBackPhoneHover}
                viewLocked
                sceneApiRef={sceneApiRef}
                materialTunes={EMPTY_PHONE_MATERIAL_TUNES}
                iphoneLiveScreen={iphoneLiveScreen}
                iphoneFocused={swapped}
                viewportFitRef={viewportFitRef}
                  onLiveScreenRect={handleLiveScreenRect}
                  androidScreenUrl={screenshot.androidScreenUrl}
                  iphoneScreenUrl={screenshot.iphoneScreenUrl}
                />
              </StageSceneReady>
            </Suspense>
          </Canvas>
        ) : (
          <div className="phone-swap__viewbox-placeholder">
            <PhoneSwapGooLoader label="Loading 3D preview…" />
          </div>
        )}

        {shouldRenderScene && !loaderGone ? (
          <div
            className={`phone-swap__loader-overlay${loaderHidden ? ' phone-swap__loader-overlay--hidden' : ''}`}
          >
            <PhoneSwapGooLoader label="Loading phones…" />
          </div>
        ) : null}
      </div>

      <PhoneScreenshotControls
        slideIndex={screenshot.slideIndex}
        slideCount={screenshot.slideCount}
        slideKeys={screenshot.slideKeys}
        screenTheme={screenshot.screenTheme}
        indicatorProgress={screenshot.indicatorProgress}
        pauseHandlers={screenshot.pauseHandlers}
        onSelectSlide={screenshot.selectSlide}
        onScreenThemeChange={screenshot.setScreenTheme}
      />
    </div>
  )
}
