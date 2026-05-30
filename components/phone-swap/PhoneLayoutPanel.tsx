'use client'

import { useFloatingPanelDrag } from '@/lib/phone-swap/useFloatingPanelDrag'
import { createPortal } from 'react-dom'
import { useEffect, useState } from 'react'
import {
  focusLabel,
  formatLayoutTs,
  type PhoneCameraView,
  type PhoneDevice,
  type PhonePose,
  type PhoneSwapEditFocus,
  type PhoneSwapLayout,
  type PhoneSwapSnapshot,
} from '@/lib/phone-swap/phoneSwapLayout'
import { PhonePoseFields } from '@/components/phone-swap/PhonePoseFields'
import {
  PHONE_STAGE_SIZE_MAX,
  PHONE_STAGE_SIZE_MIN,
  stageSizePercent,
  stageWidthPercent,
} from '@/lib/phone-swap/phoneSwapStageSize'

type GizmoMode = 'translate' | 'rotate' | 'scale'

type Props = {
  layout: PhoneSwapLayout
  editFocus: PhoneSwapEditFocus
  selected: PhoneDevice
  gizmoMode: GizmoMode
  onEditFocusChange: (focus: PhoneSwapEditFocus) => void
  onSelect: (device: PhoneDevice) => void
  onGizmoModeChange: (mode: GizmoMode) => void
  onSaveFocus: () => void
  onReset: () => void
  onClose: () => void
  showGuides: boolean
  onShowGuidesChange: (show: boolean) => void
  viewLocked: boolean
  onViewLockToggle: () => void
  onSaveView: () => void
  onResetView: () => void
  onZoomAllOut: () => void
  stageSize: number
  onStageSizeChange: (size: number) => void
  stageWidth: number
  onStageWidthChange: (width: number) => void
  camera: PhoneCameraView
  liveSnapshot: PhoneSwapSnapshot
  onDevicePoseChange: (device: PhoneDevice, pose: PhonePose) => void
}

const panelClass = 'phone-layout-panel'

export function PhoneLayoutPanel({
  layout,
  editFocus,
  selected,
  gizmoMode,
  onEditFocusChange,
  onSelect,
  onGizmoModeChange,
  onSaveFocus,
  onReset,
  onClose,
  showGuides,
  onShowGuidesChange,
  viewLocked,
  onViewLockToggle,
  onSaveView,
  onResetView,
  onZoomAllOut,
  stageSize,
  onStageSizeChange,
  stageWidth,
  onStageWidthChange,
  camera,
  liveSnapshot,
  onDevicePoseChange,
}: Props) {
  const snap = liveSnapshot
  const [portalReady, setPortalReady] = useState(false)
  const {
    panelRef,
    panelStyle,
    dragging,
    onHeaderPointerDown,
    onHeaderPointerMove,
    onHeaderPointerUp,
    onHeaderPointerCancel,
  } = useFloatingPanelDrag()

  useEffect(() => {
    setPortalReady(true)
  }, [])

  async function copyLayout() {
    const text = formatLayoutTs(layout)
    try {
      await navigator.clipboard.writeText(text)
    } catch {
      console.log(text)
    }
  }

  const panel = (
    <div
      ref={panelRef}
      className={`${panelClass}${dragging ? ' phone-layout-panel--dragging' : ''}`}
      style={panelStyle}
      role="dialog"
      aria-label="Phone layout controls"
    >
      <div
        className="phone-layout-panel__header"
        onPointerDown={onHeaderPointerDown}
        onPointerMove={onHeaderPointerMove}
        onPointerUp={onHeaderPointerUp}
        onPointerCancel={onHeaderPointerCancel}
      >
        <span className="phone-layout-panel__drag-hint" aria-hidden>
          ⋮⋮
        </span>
        <strong>Position phones</strong>
        <button type="button" className="phone-layout-panel__close" onClick={onClose}>
          Done
        </button>
      </div>

      <div className="phone-layout-panel__scroll">
        <p className="phone-layout-panel__hint">
          Drag the header bar to move this panel. View lock fixes the camera — use the gizmo or
          coordinates to move phones. Save Android focus, Swap midpoint, and iPhone focus.
        </p>

        <fieldset className="phone-layout-panel__view-box">
          <legend>View box</legend>
          <label className="phone-layout-panel__view-box-row">
            <span>Height</span>
            <input
              type="range"
              min={Math.round(PHONE_STAGE_SIZE_MIN * 100)}
              max={Math.round(PHONE_STAGE_SIZE_MAX * 100)}
              step={1}
              value={stageSizePercent(stageSize)}
              onChange={(e) => onStageSizeChange(Number(e.target.value) / 100)}
              aria-valuemin={Math.round(PHONE_STAGE_SIZE_MIN * 100)}
              aria-valuemax={Math.round(PHONE_STAGE_SIZE_MAX * 100)}
              aria-valuenow={stageSizePercent(stageSize)}
            />
            <output>{stageSizePercent(stageSize)}%</output>
          </label>
          <label className="phone-layout-panel__view-box-row">
            <span>Width</span>
            <input
              type="range"
              min={Math.round(PHONE_STAGE_SIZE_MIN * 100)}
              max={Math.round(PHONE_STAGE_SIZE_MAX * 100)}
              step={1}
              value={stageWidthPercent(stageWidth)}
              onChange={(e) => onStageWidthChange(Number(e.target.value) / 100)}
              aria-valuemin={Math.round(PHONE_STAGE_SIZE_MIN * 100)}
              aria-valuemax={Math.round(PHONE_STAGE_SIZE_MAX * 100)}
              aria-valuenow={stageWidthPercent(stageWidth)}
            />
            <output>{stageWidthPercent(stageWidth)}%</output>
          </label>
          <p className="phone-layout-panel__view-box-hint">
            Sets the visible viewport (phones clip to this box). Default 68% each — Copy
            TS persists <code>stageSize</code> (height) and <code>stageWidth</code>.
          </p>
        </fieldset>

        <div className="phone-layout-panel__row">
          <button
            type="button"
            className={viewLocked ? 'is-active' : ''}
            onClick={onViewLockToggle}
          >
            {viewLocked ? 'View locked' : 'View unlocked'}
          </button>
          <button type="button" onClick={onZoomAllOut}>
            Zoom all out
          </button>
          <button type="button" onClick={onSaveView}>
            Save view
          </button>
          <button type="button" onClick={onResetView}>
            Reset view
          </button>
        </div>

      <p className="phone-layout-panel__status phone-layout-panel__status--camera">
        Camera: [{camera.position.map((n) => n.toFixed(2)).join(', ')}] → target [
        {camera.target.map((n) => n.toFixed(2)).join(', ')}] · fov {camera.fov.toFixed(0)}
        {viewLocked ? ' · locked' : ' · drag canvas to orbit'}
      </p>

      <div className="phone-layout-panel__row">
        <button
          type="button"
          className={showGuides ? 'is-active' : ''}
          onClick={() => onShowGuidesChange(!showGuides)}
        >
          {showGuides ? 'Hide guides' : 'Show guides'}
        </button>
      </div>

      <div className="phone-layout-panel__row">
        <button
          type="button"
          className={editFocus === 'androidFocus' ? 'is-active' : ''}
          onClick={() => onEditFocusChange('androidFocus')}
        >
          Android focus
        </button>
        <button
          type="button"
          className={editFocus === 'iphoneFocus' ? 'is-active' : ''}
          onClick={() => onEditFocusChange('iphoneFocus')}
        >
          iPhone focus
        </button>
        <button
          type="button"
          className={editFocus === 'swapMidpoint' ? 'is-active' : ''}
          onClick={() => onEditFocusChange('swapMidpoint')}
        >
          Swap midpoint
        </button>
      </div>

      <div className="phone-layout-panel__row">
        <button
          type="button"
          className={selected === 'android' ? 'is-active' : ''}
          onClick={() => onSelect('android')}
        >
          Grab Android
        </button>
        <button
          type="button"
          className={selected === 'iphone' ? 'is-active' : ''}
          onClick={() => onSelect('iphone')}
        >
          Grab iPhone
        </button>
      </div>

      <div className="phone-layout-panel__row">
        <button
          type="button"
          className={gizmoMode === 'translate' ? 'is-active' : ''}
          onClick={() => onGizmoModeChange('translate')}
        >
          Move
        </button>
        <button
          type="button"
          className={gizmoMode === 'rotate' ? 'is-active' : ''}
          onClick={() => onGizmoModeChange('rotate')}
        >
          Rotate
        </button>
        <button
          type="button"
          className={gizmoMode === 'scale' ? 'is-active' : ''}
          onClick={() => onGizmoModeChange('scale')}
        >
          Scale
        </button>
      </div>

      <p className="phone-layout-panel__status">
        Editing: <strong>{focusLabel(editFocus)}</strong> · Grabbing:{' '}
        <strong>{selected === 'android' ? 'Android' : 'iPhone'}</strong>
      </p>

      <div
        className={`phone-layout-panel__pose-block${selected === 'android' ? ' is-selected' : ''}`}
      >
        <PhonePoseFields
          device="android"
          pose={snap.android}
          onChange={(pose) => onDevicePoseChange('android', pose)}
        />
      </div>

      <div
        className={`phone-layout-panel__pose-block${selected === 'iphone' ? ' is-selected' : ''}`}
      >
        <PhonePoseFields
          device="iphone"
          pose={snap.iphone}
          onChange={(pose) => onDevicePoseChange('iphone', pose)}
        />
      </div>

      <dl className="phone-layout-panel__coords">
        <div>
          <dt>Android</dt>
          <dd>
            [{snap.android.position.map((n) => n.toFixed(2)).join(', ')}] · rot [
            {snap.android.rotation.map((n) => n.toFixed(2)).join(', ')}] · ×
            {snap.android.scale.toFixed(2)}
          </dd>
        </div>
        <div>
          <dt>iPhone</dt>
          <dd>
            [{snap.iphone.position.map((n) => n.toFixed(2)).join(', ')}] · rot [
            {snap.iphone.rotation.map((n) => n.toFixed(2)).join(', ')}] · ×
            {snap.iphone.scale.toFixed(2)}
          </dd>
        </div>
      </dl>

        <div className="phone-layout-panel__row phone-layout-panel__row--actions">
          <button type="button" className="is-primary" onClick={onSaveFocus}>
            Save {focusLabel(editFocus)}
          </button>
          <button type="button" onClick={copyLayout}>
            Copy TS
          </button>
          <button type="button" onClick={onReset}>
            Reset
          </button>
        </div>
      </div>
    </div>
  )

  if (!portalReady) return null
  return createPortal(panel, document.body)
}
