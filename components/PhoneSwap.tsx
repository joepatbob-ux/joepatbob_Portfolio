'use client'

import { PhoneLayoutPanel } from '@/components/phone-swap/PhoneLayoutPanel'
import { PhoneLayoutGuides } from '@/components/phone-swap/PhoneLayoutGuides'
import { PhoneSwapScene } from '@/components/phone-swap/PhoneSwapScene'
import { Html } from '@react-three/drei'
import { Canvas } from '@react-three/fiber'
import {
  defaultRenderOrders,
  readPoseFromGroup,
} from '@/lib/phone-swap/phoneSwapAnimation'
import {
  PHONE_SWAP_LAYOUT,
  DEFAULT_LAYOUT_LOCKS,
  cloneLayout,
  cloneSnapshot,
  type PhoneDevice,
  type PhoneSwapFocus,
  type PhoneSwapLayout,
  type PhoneSwapSnapshot,
  type LayoutLocks,
  type PhonePose,
} from '@/lib/phone-swap/phoneSwapLayout'
import { DEFAULT_PHONE_CAMERA } from '@/lib/phone-swap/phoneSwapCamera'
import { usePhoneLayoutMode } from '@/lib/phone-swap/usePhoneLayoutMode'
import type { PhoneSwapSceneApi } from '@/components/phone-swap/PhoneSwapScene'
import { Suspense, useCallback, useEffect, useRef, useState } from 'react'
import type * as THREE from 'three'

/** 3D Pixel / iPhone swap — tap canvas to swap; layout tools via ?phone-layout=1 */
export function PhoneSwap() {
  const [layoutMode, setLayoutMode] = useState(false)
  const [swapped, setSwapped] = useState(false)
  const [layout, setLayout] = useState<PhoneSwapLayout>(() => cloneLayout(PHONE_SWAP_LAYOUT))
  const [editFocus, setEditFocus] = useState<PhoneSwapFocus>('androidFocus')
  const [selectedDevice, setSelectedDevice] = useState<PhoneDevice>('android')
  const [gizmoMode, setGizmoMode] = useState<'translate' | 'rotate' | 'scale'>('translate')
  const [showGuides, setShowGuides] = useState(false)
  const devControls = usePhoneLayoutMode()
  const [locks, setLocks] = useState<LayoutLocks>(() => ({ ...DEFAULT_LAYOUT_LOCKS }))
  const [liveSnapshot, setLiveSnapshot] = useState<PhoneSwapSnapshot>(() =>
    cloneSnapshot(PHONE_SWAP_LAYOUT.androidFocus),
  )
  const [animating, setAnimating] = useState(false)
  const busy = useRef(false)
  const androidRef = useRef<THREE.Group>(null)
  const iphoneRef = useRef<THREE.Group>(null)
  const sceneApiRef = useRef<PhoneSwapSceneApi | null>(null)
  const layoutRef = useRef(layout)
  layoutRef.current = layout

  const swapProgress = swapped ? 1 : 0

  useEffect(() => {
    if (!layoutMode) return
    setLiveSnapshot(cloneSnapshot(layoutRef.current[editFocus]))
  }, [layoutMode, editFocus])

  const syncFromGizmo = useCallback(() => {
    const android = androidRef.current
    const iphone = iphoneRef.current
    if (!android || !iphone) return

    const orders = defaultRenderOrders(editFocus)
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

  const doSwap = useCallback(() => {
    if (layoutMode || busy.current) return
    busy.current = true
    setAnimating(true)
    setSwapped((s) => !s)
  }, [layoutMode])

  const saveFocus = useCallback(() => {
    setLayout((prev) => ({
      ...prev,
      [editFocus]: cloneSnapshot(liveSnapshot),
    }))
  }, [editFocus, liveSnapshot])

  const resetLayout = useCallback(() => {
    const next = cloneLayout(PHONE_SWAP_LAYOUT)
    setLayout(next)
    setLiveSnapshot(cloneSnapshot(next[editFocus]))
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

  const toggleViewLock = useCallback(() => {
    setLocks((prev) => ({ ...prev, viewAngle: !prev.viewAngle }))
  }, [])

  return (
    <div
      className={`phone-swap${layoutMode ? ' phone-swap--layout-mode' : ''}${layoutMode && showGuides ? ' phone-swap--guides' : ''}`}
    >
      {devControls ? (
        <div className="phone-swap__toolbar">
          <button
            type="button"
            className={`phone-swap__layout-toggle${layoutMode ? ' is-active' : ''}`}
            onClick={() => {
              setLayoutMode((on) => {
                if (!on) setEditFocus(swapped ? 'iphoneFocus' : 'androidFocus')
                return !on
              })
            }}
          >
            {layoutMode ? 'Done positioning' : 'Adjust positions'}
          </button>
        </div>
      ) : null}

      {devControls && layoutMode ? (
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
          camera={layout.camera}
          liveSnapshot={liveSnapshot}
          onDevicePoseChange={updateDevicePose}
        />
      ) : null}

      <div className="phone-swap__stage">
        <div
          className="phone-swap__canvas-hit"
          onClick={layoutMode ? undefined : doSwap}
          role={layoutMode ? undefined : 'button'}
          tabIndex={layoutMode ? undefined : 0}
          aria-label={
            layoutMode
              ? undefined
              : swapped
                ? 'Phone models: iPhone in front. Activate to show Android in front.'
                : 'Phone models: Android in front. Activate to show iPhone in front.'
          }
        >
          {layoutMode && showGuides ? <PhoneLayoutGuides /> : null}
          <Canvas
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
            }}
            dpr={[1, 2]}
            frameloop="always"
            onCreated={({ gl }) => {
              gl.setClearColor(0x000000, 0)
            }}
          >
            <Suspense
              fallback={
                <Html center className="phone-swap__fallback">
                  Loading phones…
                </Html>
              }
            >
              <PhoneSwapScene
                layout={layout}
                swapProgress={layoutMode ? (editFocus === 'iphoneFocus' ? 1 : 0) : swapProgress}
                layoutMode={layoutMode}
                editFocus={editFocus}
                liveSnapshot={liveSnapshot}
                onGizmoChange={syncFromGizmo}
                selectedDevice={selectedDevice}
                gizmoMode={gizmoMode}
                androidRef={androidRef}
                iphoneRef={iphoneRef}
                animating={animating}
                onAnimationComplete={handleAnimationComplete}
                showGuides={showGuides}
                viewLocked={layoutMode ? locks.viewAngle : true}
                sceneApiRef={sceneApiRef}
              />
            </Suspense>
          </Canvas>
        </div>
      </div>

    </div>
  )
}
