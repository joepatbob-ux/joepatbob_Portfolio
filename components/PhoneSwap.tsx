'use client'

import { PhoneAnimTunePanel } from '@/components/phone-swap/PhoneAnimTunePanel'
import { PhoneDevToolsMenu, type PhoneDevToolsAction } from '@/components/phone-swap/PhoneDevToolsMenu'
import { PhoneLayoutPanel } from '@/components/phone-swap/PhoneLayoutPanel'
import { PhoneMaterialTunePanel } from '@/components/phone-swap/PhoneMaterialTunePanel'
import { PhoneLayoutGuides } from '@/components/phone-swap/PhoneLayoutGuides'
import { PhoneScreenshotControls } from '@/components/phone-swap/PhoneScreenshotControls'
import { PhoneSwapScene } from '@/components/phone-swap/PhoneSwapScene'
import { StageSpinner } from '@/components/stage/StageSpinner'
import { SmaPhoneScreenOverlay } from '@/components/sma-ios26/SmaPhoneScreenOverlay'
import type { DisplayScreenRect } from '@/lib/sma-ios26/displayScreenRect'
import { Html } from '@react-three/drei'
import { Canvas } from '@react-three/fiber'
import {
  readPoseFromGroup,
  renderOrdersForEdit,
} from '@/lib/phone-swap/phoneSwapAnimation'
import {
  PHONE_SWAP_LAYOUT,
  DEFAULT_LAYOUT_LOCKS,
  cloneLayout,
  cloneSnapshot,
  layoutSnapshotForEdit,
  type PhoneDevice,
  type PhoneSwapEditFocus,
  type PhoneSwapLayout,
  type PhoneSwapSnapshot,
  type LayoutLocks,
  type PhonePose,
} from '@/lib/phone-swap/phoneSwapLayout'
import { DEFAULT_PHONE_CAMERA } from '@/lib/phone-swap/phoneSwapCamera'
import {
  clampAnimSettings,
  DEFAULT_PHONE_SWAP_ANIM,
} from '@/lib/phone-swap/phoneSwapAnimSettings'
import { clampStageSize, clampStageWidth } from '@/lib/phone-swap/phoneSwapStageSize'
import {
  PHONE_VIEWPORT_DISTANCE_SCALE,
  PHONE_VIEWPORT_FIT_MARGIN,
} from '@/lib/phone-swap/phoneSwapCameraFit'
import { PHONE_MODEL_TARGET_MAX } from '@/lib/phone-swap/normalizeModel'
import {
  EMPTY_PHONE_MATERIAL_TUNES,
  type PhoneMaterialTunesByDevice,
} from '@/lib/phone-swap/phoneMaterialTune'
import { readPhoneLayoutMode } from '@/lib/phone-swap/usePhoneLayoutMode'
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
  type CSSProperties,
  type MouseEvent,
} from 'react'
import type * as THREE from 'three'

/** 3D Pixel / iPhone swap — tap back phone to swap; right-click for design debug tools. */
export function PhoneSwap({ liveScreen = false }: { liveScreen?: boolean }) {
  const hydrated = useHydrated()
  const [devToolsEnabled, setDevToolsEnabled] = useState(() => readPhoneLayoutMode())
  const [devMenu, setDevMenu] = useState<{ x: number; y: number } | null>(null)
  const [layoutMode, setLayoutMode] = useState(false)
  const [animTuneOpen, setAnimTuneOpen] = useState(false)
  const [materialTuneOpen, setMaterialTuneOpen] = useState(false)
  const [materialTunes, setMaterialTunes] =
    useState<PhoneMaterialTunesByDevice>(() => ({
      ...EMPTY_PHONE_MATERIAL_TUNES,
    }))
  const [animSettings, setAnimSettings] = useState(() =>
    clampAnimSettings(DEFAULT_PHONE_SWAP_ANIM),
  )
  const [swapped, setSwapped] = useState(false)
  const [layout, setLayout] = useState<PhoneSwapLayout>(() => cloneLayout(PHONE_SWAP_LAYOUT))
  const [editFocus, setEditFocus] = useState<PhoneSwapEditFocus>('androidFocus')
  const [selectedDevice, setSelectedDevice] = useState<PhoneDevice>('android')
  const [gizmoMode, setGizmoMode] = useState<'translate' | 'rotate' | 'scale'>('translate')
  const [showGuides, setShowGuides] = useState(false)
  const topBarNav = useLayoutTopBarNav()
  const chapterActive = useChapterActive()
  const screenshot = usePhoneScreenshotControls()
  const sceneLatchedRef = useRef(false)
  if (chapterActive || layoutMode || devToolsEnabled) {
    sceneLatchedRef.current = true
  }
  const viewboxRef = useRef<HTMLDivElement>(null)
  const [locks, setLocks] = useState<LayoutLocks>(() => ({ ...DEFAULT_LAYOUT_LOCKS }))
  const [liveSnapshot, setLiveSnapshot] = useState<PhoneSwapSnapshot>(() =>
    cloneSnapshot(PHONE_SWAP_LAYOUT.androidFocus),
  )
  const [animating, setAnimating] = useState(false)
  const [animSession, setAnimSession] = useState(0)
  const [backPhoneHover, setBackPhoneHover] = useState(false)
  const [liveScreenRect, setLiveScreenRect] = useState<DisplayScreenRect | null>(
    null,
  )
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
  const layoutRef = useRef(layout)
  layoutRef.current = layout

  const swapProgress = swapped ? 1 : 0

  useEffect(() => {
    if (!layoutMode) return
    setLiveSnapshot(cloneSnapshot(layoutSnapshotForEdit(layoutRef.current, editFocus)))
  }, [layoutMode, editFocus])

  const syncFromGizmo = useCallback(() => {
    const android = androidRef.current
    const iphone = iphoneRef.current
    if (!android || !iphone) return

    const orders = renderOrdersForEdit(editFocus, layoutRef.current)
    setLiveSnapshot({
      android: readPoseFromGroup(android, orders.android),
      iphone: readPoseFromGroup(iphone, orders.iphone),
    })
  }, [editFocus])

  const updateDevicePose = useCallback((device: PhoneDevice, pose: PhonePose) => {
    setLiveSnapshot((prev) => ({ ...prev, [device]: pose }))
  }, [])

  const handleAnimationComplete = useCallback(() => {
    busy.current = false
    setAnimating(false)
  }, [])

  const triggerSwap = useCallback(() => {
    if (busy.current) return
    busy.current = true
    setSwapped((s) => !s)
    setAnimSession((n) => n + 1)
    setAnimating(true)
  }, [])

  const doSwap = useCallback(() => {
    if (layoutMode || busy.current) return
    triggerSwap()
  }, [layoutMode, triggerSwap])

  const saveFocus = useCallback(() => {
    setLayout((prev) => ({
      ...prev,
      [editFocus]: cloneSnapshot(liveSnapshot),
    }))
  }, [editFocus, liveSnapshot])

  const layoutPreviewProgress =
    editFocus === 'iphoneFocus'
      ? 1
      : editFocus === 'androidToIphoneMidpoint' ||
          editFocus === 'iphoneToAndroidMidpoint'
        ? 0.5
        : 0

  const resetLayout = useCallback(() => {
    const next = cloneLayout(PHONE_SWAP_LAYOUT)
    setLayout(next)
    setLiveSnapshot(cloneSnapshot(layoutSnapshotForEdit(next, editFocus)))
  }, [editFocus])

  const saveView = useCallback(() => {
    const view = sceneApiRef.current?.saveCameraView()
    if (!view) return
    setLayout((prev) => ({ ...prev, camera: view }))
    setLocks((prev) => ({ ...prev, viewAngle: true }))
  }, [])

  const resetView = useCallback(() => {
    setLayout((prev) => ({ ...prev, camera: DEFAULT_PHONE_CAMERA }))
    setLocks((prev) => ({ ...prev, viewAngle: true }))
  }, [])

  const zoomAllOut = useCallback(() => {
    const view = sceneApiRef.current?.zoomAllOut()
    if (!view) return
    setLayout((prev) => ({ ...prev, camera: view }))
    setLocks((prev) => ({ ...prev, viewAngle: true }))
  }, [])

  const toggleViewLock = useCallback(() => {
    setLocks((prev) => ({ ...prev, viewAngle: !prev.viewAngle }))
  }, [])

  const setStageSize = useCallback((size: number) => {
    setLayout((prev) => ({ ...prev, stageSize: clampStageSize(size) }))
  }, [])

  const setStageWidth = useCallback((width: number) => {
    setLayout((prev) => ({ ...prev, stageWidth: clampStageWidth(width) }))
  }, [])

  const closeDevTools = useCallback(() => {
    setDevMenu(null)
    setDevToolsEnabled(false)
    setLayoutMode(false)
    setAnimTuneOpen(false)
    setMaterialTuneOpen(false)
  }, [])

  const handleDevToolsAction = useCallback(
    (action: PhoneDevToolsAction) => {
      setDevMenu(null)
      if (action === 'hide') {
        closeDevTools()
        return
      }

      setDevToolsEnabled(true)
      if (action === 'layout') {
        setEditFocus(swapped ? 'iphoneFocus' : 'androidFocus')
        setLayoutMode(true)
        return
      }
      if (action === 'anim') {
        setAnimTuneOpen(true)
        return
      }
      setMaterialTuneOpen(true)
    },
    [closeDevTools, swapped],
  )

  const handleViewboxContextMenu = useCallback((event: MouseEvent<HTMLDivElement>) => {
      event.preventDefault()
    setDevMenu({ x: event.clientX, y: event.clientY })
  }, [])

  const inFlowChapter = topBarNav && !layoutMode
  const shouldRenderScene =
    sceneLatchedRef.current || layoutMode || devToolsEnabled
  const runSceneLoop = chapterActive || layoutMode || devToolsEnabled
  const useScrollPassthrough = inFlowChapter && !layoutMode
  /** Layout editor only — production uses CSS container size + camera fit, not stage tune shrink. */
  const viewBoxVars = layoutMode
    ? ({
        '--phone-swap-height': String(layout.stageSize),
        '--phone-swap-width': String(layout.stageWidth),
      } as CSSProperties)
    : undefined
  const invalidateCanvasRef = useRef<(() => void) | null>(null)
  const viewportFitRef = useRef({
    margin: PHONE_VIEWPORT_FIT_MARGIN,
    distanceScale: PHONE_VIEWPORT_DISTANCE_SCALE,
  })

  usePhoneSwapTouchScroll(viewboxRef, useScrollPassthrough)

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

  if (isPrerenderSnapshot() || !hydrated) {
    return null
  }

  return (
    <div
      className={`phone-swap${inFlowChapter ? ' phone-swap--mobile-bleed phone-swap--in-flow' : ''}${layoutMode ? ' phone-swap--layout-mode' : ''}${animTuneOpen ? ' phone-swap--anim-tune' : ''}${materialTuneOpen ? ' phone-swap--material-tune' : ''}${layoutMode && showGuides ? ' phone-swap--guides' : ''}`}
      style={viewBoxVars}
    >
      {devToolsEnabled ? (
        <div className="phone-swap__toolbar">
          <button
            type="button"
            className={`phone-swap__layout-toggle${layoutMode ? ' is-active' : ''}`}
            onClick={() => {
              setLayoutMode((on) => {
                if (!on) {
                  setEditFocus(swapped ? 'iphoneFocus' : 'androidFocus')
                }
                return !on
              })
            }}
          >
            {layoutMode ? 'Done positioning' : 'Adjust positions'}
          </button>
          <button
            type="button"
            className={`phone-swap__layout-toggle${animTuneOpen ? ' is-active' : ''}`}
            onClick={() => setAnimTuneOpen((on) => !on)}
          >
            {animTuneOpen ? 'Done animation' : 'Tune animation'}
          </button>
          <button
            type="button"
            className={`phone-swap__layout-toggle${materialTuneOpen ? ' is-active' : ''}`}
            onClick={() => setMaterialTuneOpen((on) => !on)}
          >
            {materialTuneOpen ? 'Done materials' : 'Tune materials'}
          </button>
        </div>
      ) : null}

      {devToolsEnabled && materialTuneOpen ? (
        <PhoneMaterialTunePanel
          androidRef={androidRef}
          iphoneRef={iphoneRef}
          tunes={materialTunes}
          onChange={setMaterialTunes}
          onClose={() => setMaterialTuneOpen(false)}
        />
      ) : null}

      {devToolsEnabled && animTuneOpen ? (
        <PhoneAnimTunePanel
          settings={animSettings}
          onChange={setAnimSettings}
          onReset={() => setAnimSettings(clampAnimSettings(DEFAULT_PHONE_SWAP_ANIM))}
          onClose={() => setAnimTuneOpen(false)}
          onPreviewSwap={triggerSwap}
          swapped={swapped}
        />
      ) : null}

      {devToolsEnabled && layoutMode ? (
        <PhoneLayoutPanel
          layout={layout}
          editFocus={editFocus}
          selected={selectedDevice}
          gizmoMode={gizmoMode}
          onEditFocusChange={setEditFocus}
          onSelect={setSelectedDevice}
          onGizmoModeChange={setGizmoMode}
          onSaveFocus={saveFocus}
          onReset={resetLayout}
          onClose={() => setLayoutMode(false)}
          showGuides={showGuides}
          onShowGuidesChange={setShowGuides}
          viewLocked={locks.viewAngle}
          onViewLockToggle={toggleViewLock}
          onSaveView={saveView}
          onResetView={resetView}
          onZoomAllOut={zoomAllOut}
          stageSize={layout.stageSize}
          onStageSizeChange={setStageSize}
          stageWidth={layout.stageWidth}
          onStageWidthChange={setStageWidth}
          camera={layout.camera}
          liveSnapshot={liveSnapshot}
          onDevicePoseChange={updateDevicePose}
        />
      ) : null}

      {iphoneLiveScreen ? (
        <SmaPhoneScreenOverlay
          rect={liveScreenRect}
          visible={swapped}
          interactive={swapped && !layoutMode && !animating}
        />
      ) : null}

      <div
        ref={viewboxRef}
        className={`phone-swap__viewbox${backPhoneHover ? ' phone-swap__viewbox--swap-target' : ''}${swapped && iphoneLiveScreen && !layoutMode && !animating ? ' phone-swap__viewbox--live-interactive' : ''}`}
        tabIndex={layoutMode ? undefined : 0}
        onContextMenu={handleViewboxContextMenu}
        onKeyDown={
          layoutMode
            ? undefined
            : (e) => {
                if (e.key !== 'Enter' && e.key !== ' ') return
                e.preventDefault()
                doSwap()
              }
        }
        aria-label={
          layoutMode || inFlowChapter
            ? undefined
            : swapped
              ? 'Phone models: iPhone in front. Tap the Android in back to swap.'
              : 'Phone models: Android in front. Tap the iPhone in back to swap.'
        }
      >
        {layoutMode && showGuides ? <PhoneLayoutGuides /> : null}
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
            <Suspense
              fallback={
                <Html center>
                  <StageSpinner label="Loading phones…" />
                </Html>
              }
            >
              <PhoneSwapScene
                layout={layout}
                swapProgress={
                  layoutMode && !animating ? layoutPreviewProgress : swapProgress
                }
                layoutMode={layoutMode}
                editFocus={editFocus}
                liveSnapshot={liveSnapshot}
                onGizmoChange={syncFromGizmo}
                selectedDevice={selectedDevice}
                gizmoMode={gizmoMode}
                androidRef={androidRef}
                iphoneRef={iphoneRef}
                animating={animating}
                animSession={animSession}
                animSettings={animSettings}
                onAnimationComplete={handleAnimationComplete}
                onSwapRequest={triggerSwap}
                onBackHoverChange={setBackPhoneHover}
                showGuides={showGuides}
                viewLocked={layoutMode ? locks.viewAngle : true}
                sceneApiRef={sceneApiRef}
                materialTunes={materialTunes}
                iphoneLiveScreen={iphoneLiveScreen}
                iphoneFocused={swapped}
                viewportFitRef={viewportFitRef}
                onLiveScreenRect={handleLiveScreenRect}
                androidScreenUrl={screenshot.androidScreenUrl}
                iphoneScreenUrl={screenshot.iphoneScreenUrl}
              />
            </Suspense>
        </Canvas>
        ) : (
          <div className="phone-swap__viewbox-placeholder">
            <StageSpinner label="Loading 3D preview…" />
          </div>
        )}
      </div>

      {!layoutMode && !animTuneOpen && !materialTuneOpen ? (
        <PhoneScreenshotControls
          slideIndex={screenshot.slideIndex}
          slideCount={screenshot.slideCount}
          slideKeys={screenshot.slideKeys}
          screenTheme={screenshot.screenTheme}
          onSelectSlide={screenshot.selectSlide}
          onScreenThemeChange={screenshot.setScreenTheme}
        />
      ) : null}

      {devMenu ? (
        <PhoneDevToolsMenu
          x={devMenu.x}
          y={devMenu.y}
          devToolsEnabled={devToolsEnabled}
          onSelect={handleDevToolsAction}
          onClose={() => setDevMenu(null)}
        />
      ) : null}

    </div>
  )
}
