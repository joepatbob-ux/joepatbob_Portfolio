'use client'

import { useFloatingPanelDrag } from '@/lib/phone-swap/useFloatingPanelDrag'
import {
  clampAnimSettings,
  DEFAULT_PHONE_SWAP_ANIM,
  formatAnimSettingsTs,
  PHONE_SWAP_ANIM_MS_MAX,
  PHONE_SWAP_ANIM_MS_MIN,
  type PhoneSwapAnimSettings,
} from '@/lib/phone-swap/phoneSwapAnimSettings'
import { createPortal } from 'react-dom'
import { useEffect, useState } from 'react'

type Props = {
  settings: PhoneSwapAnimSettings
  onChange: (settings: PhoneSwapAnimSettings) => void
  onReset: () => void
  onClose: () => void
  onPreviewSwap: () => void
  swapped: boolean
}

const panelClass = 'phone-layout-panel phone-anim-tune-panel'

function animPanelDefault(): { x: number; y: number } {
  return { x: 16, y: 120 }
}

function pct(value: number, min: number, max: number): number {
  return Math.round(((value - min) / (max - min)) * 100)
}

function fromPct(pctValue: number, min: number, max: number): number {
  return min + (pctValue / 100) * (max - min)
}

export function PhoneAnimTunePanel({
  settings,
  onChange,
  onReset,
  onClose,
  onPreviewSwap,
  swapped,
}: Props) {
  const [portalReady, setPortalReady] = useState(false)
  const s = clampAnimSettings(settings)

  const {
    panelRef,
    panelStyle,
    dragging,
    onHeaderPointerDown,
    onHeaderPointerMove,
    onHeaderPointerUp,
    onHeaderPointerCancel,
  } = useFloatingPanelDrag({
    storageKey: 'phone-anim-tune-panel-position',
    defaultPosition: animPanelDefault,
  })

  useEffect(() => {
    setPortalReady(true)
  }, [])

  async function copySettings() {
    const text = formatAnimSettingsTs(s)
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
      aria-label="Phone swap animation controls"
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
        <strong>Swap animation</strong>
        <button type="button" className="phone-layout-panel__close" onClick={onClose}>
          Done
        </button>
      </div>

      <div className="phone-layout-panel__scroll">
        <p className="phone-layout-panel__hint">
          Dial in timing while the panel is open — changes apply immediately. Use Preview
          swap or tap the canvas. Copy TS when happy, then paste into{' '}
          <code>phoneSwapAnimSettings.ts</code>.
        </p>

        <fieldset className="phone-layout-panel__view-box">
          <legend>Duration</legend>
          <label className="phone-layout-panel__view-box-row">
            <span>Speed</span>
            <input
              type="range"
              min={0}
              max={100}
              step={1}
              value={pct(
                s.durationMs,
                PHONE_SWAP_ANIM_MS_MIN,
                PHONE_SWAP_ANIM_MS_MAX,
              )}
              onChange={(e) =>
                onChange(
                  clampAnimSettings({
                    ...s,
                    durationMs: fromPct(
                      Number(e.target.value),
                      PHONE_SWAP_ANIM_MS_MIN,
                      PHONE_SWAP_ANIM_MS_MAX,
                    ),
                  }),
                )
              }
            />
            <output>{(s.durationMs / 1000).toFixed(2)}s</output>
          </label>
          <p className="phone-layout-panel__view-box-hint">
            Lower = faster ({PHONE_SWAP_ANIM_MS_MIN}–{PHONE_SWAP_ANIM_MS_MAX} ms). Default{' '}
            {(DEFAULT_PHONE_SWAP_ANIM.durationMs / 1000).toFixed(2)}s.
          </p>
        </fieldset>

        <fieldset className="phone-layout-panel__view-box">
          <legend>Midpoint depth blend</legend>
          <label className="phone-layout-panel__view-box-row">
            <span>Start</span>
            <input
              type="range"
              min={20}
              max={48}
              step={1}
              value={Math.round(s.depthBlendStart * 100)}
              onChange={(e) =>
                onChange(
                  clampAnimSettings({
                    ...s,
                    depthBlendStart: Number(e.target.value) / 100,
                  }),
                )
              }
            />
            <output>{Math.round(s.depthBlendStart * 100)}%</output>
          </label>
          <label className="phone-layout-panel__view-box-row">
            <span>End</span>
            <input
              type="range"
              min={52}
              max={80}
              step={1}
              value={Math.round(s.depthBlendEnd * 100)}
              onChange={(e) =>
                onChange(
                  clampAnimSettings({
                    ...s,
                    depthBlendEnd: Number(e.target.value) / 100,
                  }),
                )
              }
            />
            <output>{Math.round(s.depthBlendEnd * 100)}%</output>
          </label>
          <p className="phone-layout-panel__view-box-hint">
            Wider band = softer depth handoff at the pass-around pose; narrower = snappier
            layer change.
          </p>
        </fieldset>

        <p className="phone-layout-panel__status">
          Front: <strong>{swapped ? 'iPhone' : 'Android'}</strong>
        </p>

        <div className="phone-layout-panel__row phone-layout-panel__row--actions">
          <button
            type="button"
            className="is-active"
            onClick={(e) => {
              e.stopPropagation()
              onPreviewSwap()
            }}
          >
            Preview swap
          </button>
          <button type="button" onClick={onReset}>
            Reset anim
          </button>
          <button type="button" onClick={copySettings}>
            Copy TS
          </button>
        </div>
      </div>
    </div>
  )

  if (!portalReady || typeof document === 'undefined') return null
  return createPortal(panel, document.body)
}
