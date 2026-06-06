'use client'

import {
  BOWL_MATERIAL_OPTIONS,
  type BowlGlassMode,
} from '@/lib/everything-in-between/bowlGlassMaterial'
import {
  DEFAULT_BOWL_GLASS_TUNE,
  formatBowlGlassTuneTs,
  type BowlGlassTuneSettings,
} from '@/lib/everything-in-between/bowlGlassTune'
import { useFloatingPanelDrag } from '@/lib/phone-swap/useFloatingPanelDrag'
import { createPortal } from 'react-dom'
import { useCallback, useEffect, useState } from 'react'

type Props = {
  tune: BowlGlassTuneSettings
  onChange: (next: BowlGlassTuneSettings) => void
  onClose: () => void
}

const panelClass = 'phone-layout-panel bowl-glass-tune-panel'

function panelDefault() {
  return { x: 16, y: 120 }
}

function pct(value: number, min: number, max: number): number {
  return Math.round(((value - min) / (max - min)) * 100)
}

function fromPct(pctValue: number, min: number, max: number): number {
  return min + (pctValue / 100) * (max - min)
}

type SliderSpec = {
  key: keyof BowlGlassTuneSettings
  label: string
  min: number
  max: number
  step?: number
  hint?: string
}

const SLIDERS: SliderSpec[] = [
  { key: 'transmission', label: 'Transmission', min: 0, max: 1, step: 0.01, hint: '↑ clearer' },
  { key: 'opacity', label: 'Opacity', min: 0.02, max: 1, step: 0.01 },
  { key: 'roughness', label: 'Roughness', min: 0, max: 1, step: 0.01, hint: '↓ clearer' },
  { key: 'thickness', label: 'Thickness', min: 0, max: 1.2, step: 0.01, hint: '↓ less haze' },
  { key: 'ior', label: 'IOR', min: 1, max: 2.2, step: 0.01 },
  { key: 'envMapIntensity', label: 'Env reflection', min: 0, max: 2, step: 0.01 },
  { key: 'clearcoat', label: 'Clearcoat', min: 0, max: 1, step: 0.01 },
  { key: 'clearcoatRoughness', label: 'Clearcoat rough', min: 0, max: 1, step: 0.01 },
  { key: 'metalness', label: 'Metalness', min: 0, max: 1, step: 0.01 },
  {
    key: 'attenuationDistance',
    label: 'Attenuation dist',
    min: 0.1,
    max: 20,
    step: 0.1,
    hint: '↑ less volume tint',
  },
]

export function BowlGlassTunePanel({ tune, onChange, onClose }: Props) {
  const [portalReady, setPortalReady] = useState(false)

  const {
    panelRef,
    panelStyle,
    dragging,
    onHeaderPointerDown,
    onHeaderPointerMove,
    onHeaderPointerUp,
    onHeaderPointerCancel,
  } = useFloatingPanelDrag({
    storageKey: 'bowl-glass-tune-panel-position',
    defaultPosition: panelDefault,
  })

  useEffect(() => {
    setPortalReady(true)
  }, [])

  const patch = useCallback(
    (partial: Partial<BowlGlassTuneSettings>) => {
      onChange({ ...tune, ...partial })
    },
    [onChange, tune],
  )

  async function copyTune() {
    const text = formatBowlGlassTuneTs(tune)
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
      aria-label="Bowl glass material controls"
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
        <strong>Bowl glass</strong>
        <button type="button" className="phone-layout-panel__close" onClick={onClose}>
          Done
        </button>
      </div>

      <div className="phone-layout-panel__scroll">
        <p className="phone-layout-panel__hint">
          Live-tweak fishbowl glass. Right-click the bowl to reopen. Add{' '}
          <code>?bowl-tune=1</code> to the URL to show a tune button.
        </p>

        <label className="phone-layout-panel__view-box-row">
          <span>Preset mode</span>
          <select
            className="phone-material-tune-panel__select"
            value={tune.mode}
            onChange={(e) => patch({ mode: e.target.value as BowlGlassMode })}
          >
            {BOWL_MATERIAL_OPTIONS.map((opt) => (
              <option key={opt.id} value={opt.id}>
                {opt.label}
              </option>
            ))}
          </select>
        </label>

        <label className="phone-layout-panel__view-box-row bowl-glass-tune-panel__check">
          <span>No tint</span>
          <input
            type="checkbox"
            checked={tune.noTint}
            onChange={(e) =>
              patch({
                noTint: e.target.checked,
                ...(e.target.checked
                  ? {
                      color: '#ffffff',
                      attenuationColor: '#ffffff',
                      thickness: Math.min(tune.thickness, 0.02),
                      attenuationDistance: Math.max(tune.attenuationDistance, 24),
                    }
                  : {}),
              })
            }
          />
        </label>

        <label className="phone-layout-panel__view-box-row">
          <span>Color tint</span>
          <input
            type="color"
            value={tune.color}
            disabled={tune.noTint}
            onChange={(e) => patch({ color: e.target.value, noTint: false })}
          />
        </label>

        <label className="phone-layout-panel__view-box-row">
          <span>Attenuation color</span>
          <input
            type="color"
            value={tune.attenuationColor}
            disabled={tune.noTint}
            onChange={(e) =>
              patch({ attenuationColor: e.target.value, noTint: false })
            }
          />
        </label>

        {SLIDERS.map((spec) => {
          const value = tune[spec.key] as number
          return (
            <label key={spec.key} className="phone-layout-panel__view-box-row">
              <span>
                {spec.label}
                {spec.hint ? (
                  <small className="bowl-glass-tune-panel__hint-inline">
                    {' '}
                    ({spec.hint})
                  </small>
                ) : null}
              </span>
              <input
                type="range"
                min={0}
                max={100}
                value={pct(value, spec.min, spec.max)}
                onChange={(e) =>
                  patch({
                    [spec.key]: fromPct(Number(e.target.value), spec.min, spec.max),
                  } as Partial<BowlGlassTuneSettings>)
                }
              />
              <output>{value.toFixed(3)}</output>
            </label>
          )
        })}

        <label className="phone-layout-panel__view-box-row bowl-glass-tune-panel__check">
          <span>Depth write</span>
          <input
            type="checkbox"
            checked={tune.depthWrite}
            onChange={(e) => patch({ depthWrite: e.target.checked })}
          />
        </label>

        <div className="phone-layout-panel__row phone-layout-panel__row--actions">
          <button type="button" onClick={() => onChange({ ...DEFAULT_BOWL_GLASS_TUNE })}>
            Reset defaults
          </button>
          <button type="button" onClick={copyTune}>
            Copy TS
          </button>
        </div>
      </div>
    </div>
  )

  if (!portalReady) return null
  return createPortal(panel, document.body)
}
