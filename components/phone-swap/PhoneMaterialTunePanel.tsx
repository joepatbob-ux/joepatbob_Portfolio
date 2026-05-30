'use client'

import { useFloatingPanelDrag } from '@/lib/phone-swap/useFloatingPanelDrag'
import {
  inspectPhoneMaterials,
  PHONE_MATERIAL_DEVICE_LABEL,
  PHONE_MATERIAL_ROLE_LABEL,
  type PhoneMaterialDevice,
  type PhoneMaterialRole,
  type PhoneMaterialSlotInfo,
} from '@/lib/phone-swap/phoneMaterialInspect'
import {
  EMPTY_PHONE_MATERIAL_TUNES,
  formatMaterialTunesTs,
  type PhoneMaterialOverride,
  type PhoneMaterialTuneState,
  type PhoneMaterialTunesByDevice,
} from '@/lib/phone-swap/phoneMaterialTune'
import { createPortal } from 'react-dom'
import { useCallback, useEffect, useMemo, useState } from 'react'
import type { RefObject } from 'react'
import type * as THREE from 'three'

type Props = {
  androidRef: RefObject<THREE.Group | null>
  iphoneRef: RefObject<THREE.Group | null>
  tunes: PhoneMaterialTunesByDevice
  onChange: (tunes: PhoneMaterialTunesByDevice) => void
  onClose: () => void
}

const panelClass = 'phone-layout-panel phone-material-tune-panel'

function panelDefault(): { x: number; y: number } {
  return { x: 16, y: 240 }
}

function pct(value: number, min: number, max: number): number {
  return Math.round(((value - min) / (max - min)) * 100)
}

function fromPct(pctValue: number, min: number, max: number): number {
  return min + (pctValue / 100) * (max - min)
}

function mergeOverride(
  tunes: PhoneMaterialTunesByDevice,
  device: PhoneMaterialDevice,
  id: string,
  patch: Partial<PhoneMaterialOverride>,
): PhoneMaterialTunesByDevice {
  const deviceTunes = tunes[device] ?? {}
  const prev = deviceTunes[id] ?? {}
  const next = { ...prev, ...patch }
  const cleaned = Object.fromEntries(
    Object.entries(next).filter(([, v]) => v !== undefined),
  ) as PhoneMaterialOverride

  let nextDeviceTunes: PhoneMaterialTuneState
  if (Object.keys(cleaned).length === 0) {
    const { [id]: _, ...rest } = deviceTunes
    nextDeviceTunes = rest
  } else {
    nextDeviceTunes = { ...deviceTunes, [id]: cleaned }
  }

  return { ...tunes, [device]: nextDeviceTunes }
}

export function PhoneMaterialTunePanel({
  androidRef,
  iphoneRef,
  tunes,
  onChange,
  onClose,
}: Props) {
  const [portalReady, setPortalReady] = useState(false)
  const [device, setDevice] = useState<PhoneMaterialDevice>('android')
  const [inventory, setInventory] = useState<PhoneMaterialSlotInfo[]>([])
  const [selectedId, setSelectedId] = useState<string>('')
  const [roleFilter, setRoleFilter] = useState<PhoneMaterialRole | 'all'>('all')

  const deviceRef = device === 'android' ? androidRef : iphoneRef
  const deviceTunes = tunes[device] ?? EMPTY_PHONE_MATERIAL_TUNES[device]

  const {
    panelRef,
    panelStyle,
    dragging,
    onHeaderPointerDown,
    onHeaderPointerMove,
    onHeaderPointerUp,
    onHeaderPointerCancel,
  } = useFloatingPanelDrag({
    storageKey: 'phone-material-tune-panel-position',
    defaultPosition: panelDefault,
  })

  const refreshInventory = useCallback(() => {
    const rows = inspectPhoneMaterials(deviceRef.current, device)
    setInventory(rows)
    if (rows.length && !rows.some((r) => r.id === selectedId)) {
      setSelectedId(rows[0]!.id)
    }
  }, [device, deviceRef, selectedId])

  useEffect(() => {
    setPortalReady(true)
  }, [])

  useEffect(() => {
    setSelectedId('')
    setRoleFilter('all')
  }, [device])

  useEffect(() => {
    refreshInventory()
    const id = window.setInterval(refreshInventory, 1500)
    return () => window.clearInterval(id)
  }, [refreshInventory])

  const filtered = useMemo(() => {
    if (roleFilter === 'all') return inventory
    return inventory.filter((row) => row.role === roleFilter)
  }, [inventory, roleFilter])

  const selected =
    inventory.find((row) => row.id === selectedId) ?? filtered[0] ?? null

  const override = selected ? deviceTunes[selected.id] : undefined

  const effective = selected
    ? {
        color: override?.color ?? selected.color,
        roughness: override?.roughness ?? selected.roughness ?? 0.5,
        metalness: override?.metalness ?? selected.metalness ?? 0.5,
        envMapIntensity:
          override?.envMapIntensity ?? selected.envMapIntensity ?? 1,
        opacity: override?.opacity ?? selected.opacity,
        visible: override?.visible ?? selected.visible,
      }
    : null

  const isStandard = selected?.materialType === 'MeshStandard'

  async function copyTunes() {
    const text = formatMaterialTunesTs(deviceTunes, inventory, device)
    try {
      await navigator.clipboard.writeText(text)
    } catch {
      console.log(text)
    }
  }

  function resetSlot() {
    if (!selected) return
    const { [selected.id]: _, ...rest } = deviceTunes
    onChange({ ...tunes, [device]: rest })
  }

  function resetDevice() {
    onChange({ ...tunes, [device]: {} })
  }

  function resetAll() {
    onChange({ android: {}, iphone: {} })
  }

  const panel = (
    <div
      ref={panelRef}
      className={`${panelClass}${dragging ? ' phone-layout-panel--dragging' : ''}`}
      style={panelStyle}
      role="dialog"
      aria-label="Phone material controls"
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
        <strong>Phone materials</strong>
        <button type="button" className="phone-layout-panel__close" onClick={onClose}>
          Done
        </button>
      </div>

      <div className="phone-layout-panel__scroll">
        <p className="phone-layout-panel__hint">
          Live-tweak materials on either 3D model. Copy TS to bake values into the
          source prep files for each phone.
        </p>

        <label className="phone-layout-panel__view-box-row phone-material-tune-panel__select-row">
          <span>Phone</span>
          <select
            className="phone-material-tune-panel__select"
            value={device}
            aria-label="Select phone model"
            onChange={(e) => setDevice(e.target.value as PhoneMaterialDevice)}
          >
            {(Object.keys(PHONE_MATERIAL_DEVICE_LABEL) as PhoneMaterialDevice[]).map(
              (key) => (
                <option key={key} value={key}>
                  {PHONE_MATERIAL_DEVICE_LABEL[key]}
                </option>
              ),
            )}
          </select>
        </label>

        <div className="phone-layout-panel__row">
          <button type="button" onClick={refreshInventory}>
            Refresh list
          </button>
          <span className="phone-material-tune-panel__count">
            {inventory.length} meshes
          </span>
        </div>

        <label className="phone-layout-panel__view-box-row phone-material-tune-panel__select-row">
          <span>Part type</span>
          <select
            className="phone-material-tune-panel__select"
            value={roleFilter}
            aria-label="Filter materials by part type"
            onChange={(e) =>
              setRoleFilter(e.target.value as PhoneMaterialRole | 'all')
            }
          >
            <option value="all">All parts</option>
            {(Object.keys(PHONE_MATERIAL_ROLE_LABEL) as PhoneMaterialRole[]).map(
              (role) => (
                <option key={role} value={role}>
                  {PHONE_MATERIAL_ROLE_LABEL[role]}
                </option>
              ),
            )}
          </select>
        </label>
        <p className="phone-material-tune-panel__field-hint">
          Part type groups meshes (body, camera, screen, etc.) so the list below
          is shorter.
        </p>

        <label className="phone-layout-panel__view-box-row phone-material-tune-panel__select-row">
          <span>Mesh</span>
          <select
            className="phone-material-tune-panel__select"
            value={selected?.id ?? ''}
            aria-label="Select material mesh to edit"
            onChange={(e) => setSelectedId(e.target.value)}
          >
            {filtered.map((row) => (
              <option key={row.id} value={row.id}>
                {row.id}
                {row.materialName !== row.id ? ` · ${row.materialName}` : ''} (
                {PHONE_MATERIAL_ROLE_LABEL[row.role]})
              </option>
            ))}
          </select>
        </label>
        <p className="phone-material-tune-panel__field-hint">
          Mesh is the 3D export name for one paintable surface — pick one, then
          tweak color / roughness below.
        </p>

        {selected && effective ? (
          <fieldset className="phone-layout-panel__view-box">
            <legend>{selected.slotName}</legend>
            <p className="phone-layout-panel__view-box-hint">
              {PHONE_MATERIAL_ROLE_LABEL[selected.role]} · {selected.materialType}
              {selected.materialName ? ` · ${selected.materialName}` : ''}
              {selected.hasMap ? ' · map' : ''}
              {selected.hasAlphaMap ? ' · alpha' : ''}
              {!selected.visible ? ' · hidden in scene' : ''}
            </p>

            <label className="phone-layout-panel__view-box-row phone-material-tune-panel__color-row">
              <span>Color</span>
              <input
                type="color"
                value={effective.color}
                onChange={(e) =>
                  onChange(
                    mergeOverride(tunes, device, selected.id, {
                      color: e.target.value,
                    }),
                  )
                }
              />
              <code>{effective.color}</code>
            </label>

            {isStandard ? (
              <>
                <label className="phone-layout-panel__view-box-row">
                  <span>Roughness</span>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={pct(effective.roughness, 0, 1)}
                    onChange={(e) =>
                      onChange(
                        mergeOverride(tunes, device, selected.id, {
                          roughness: fromPct(Number(e.target.value), 0, 1),
                        }),
                      )
                    }
                  />
                  <output>{effective.roughness.toFixed(2)}</output>
                </label>
                <label className="phone-layout-panel__view-box-row">
                  <span>Metalness</span>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={pct(effective.metalness, 0, 1)}
                    onChange={(e) =>
                      onChange(
                        mergeOverride(tunes, device, selected.id, {
                          metalness: fromPct(Number(e.target.value), 0, 1),
                        }),
                      )
                    }
                  />
                  <output>{effective.metalness.toFixed(2)}</output>
                </label>
                <label className="phone-layout-panel__view-box-row">
                  <span>Env intensity</span>
                  <input
                    type="range"
                    min={0}
                    max={200}
                    value={pct(effective.envMapIntensity, 0, 2)}
                    onChange={(e) =>
                      onChange(
                        mergeOverride(tunes, device, selected.id, {
                          envMapIntensity: fromPct(Number(e.target.value), 0, 2),
                        }),
                      )
                    }
                  />
                  <output>{effective.envMapIntensity.toFixed(2)}</output>
                </label>
              </>
            ) : null}

            <label className="phone-layout-panel__view-box-row">
              <span>Opacity</span>
              <input
                type="range"
                min={0}
                max={100}
                value={pct(effective.opacity, 0, 1)}
                onChange={(e) =>
                  onChange(
                    mergeOverride(tunes, device, selected.id, {
                      opacity: fromPct(Number(e.target.value), 0, 1),
                    }),
                  )
                }
              />
              <output>{effective.opacity.toFixed(2)}</output>
            </label>

            <label className="phone-layout-panel__view-box-row phone-material-tune-panel__check">
              <span>Visible</span>
              <input
                type="checkbox"
                checked={effective.visible}
                onChange={(e) =>
                  onChange(
                    mergeOverride(tunes, device, selected.id, {
                      visible: e.target.checked,
                    }),
                  )
                }
              />
            </label>
          </fieldset>
        ) : (
          <p className="phone-layout-panel__hint">
            Loading {PHONE_MATERIAL_DEVICE_LABEL[device]} meshes…
          </p>
        )}

        <div className="phone-layout-panel__row phone-layout-panel__row--actions">
          <button type="button" onClick={resetSlot} disabled={!selected || !override}>
            Reset mesh
          </button>
          <button type="button" onClick={resetDevice}>
            Reset phone
          </button>
          <button type="button" onClick={resetAll}>
            Reset all
          </button>
          <button type="button" onClick={copyTunes}>
            Copy TS
          </button>
        </div>
      </div>
    </div>
  )

  if (!portalReady || typeof document === 'undefined') return null
  return createPortal(panel, document.body)
}
