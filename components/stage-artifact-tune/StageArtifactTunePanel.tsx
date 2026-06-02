'use client'

import { useStageArtifactTune } from '@/components/stage-artifact-tune/StageArtifactTuneProvider'
import { formatStageTuneCss } from '@/lib/stage-artifact-tune/applyCssVars'
import {
  STAGE_TUNE_LIMITS,
  type StageArtifactTuneSettings,
} from '@/lib/stage-artifact-tune/settings'
import {
  stageSizePercent,
  stageWidthPercent,
} from '@/lib/phone-swap/phoneSwapStageSize'
import { useFloatingPanelDrag } from '@/lib/phone-swap/useFloatingPanelDrag'
import { useEffect, useState } from 'react'

const panelClass = 'phone-layout-panel stage-artifact-tune-panel'

function SliderRow({
  label,
  value,
  min,
  max,
  step,
  unit,
  onChange,
}: {
  label: string
  value: number
  min: number
  max: number
  step: number
  unit: string
  onChange: (next: number) => void
}) {
  return (
    <label className="phone-layout-panel__view-box-row">
      <span>{label}</span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
      <output>
        {value}
        {unit}
      </output>
    </label>
  )
}

function TuneSection({
  legend,
  hint,
  children,
}: {
  legend: string
  hint?: string
  children: React.ReactNode
}) {
  return (
    <fieldset className="phone-layout-panel__view-box">
      <legend>{legend}</legend>
      {children}
      {hint ? <p className="phone-layout-panel__view-box-hint">{hint}</p> : null}
    </fieldset>
  )
}

export function StageArtifactTunePanel() {
  const { settings, patchSettings, resetSettings } = useStageArtifactTune()
  const [activeChapterId, setActiveChapterId] = useState<string | null>(null)
  const [copyStatus, setCopyStatus] = useState<string | null>(null)

  const {
    panelRef,
    panelStyle,
    dragging,
    onHeaderPointerDown,
    onHeaderPointerMove,
    onHeaderPointerUp,
    onHeaderPointerCancel,
  } = useFloatingPanelDrag({
    storageKey: 'stage-artifact-tune-panel-position',
    defaultPosition: () => ({ x: 16, y: 120 }),
  })

  useEffect(() => {
    const slots = document.querySelectorAll<HTMLElement>('[data-chapter-id]')
    if (!slots.length) return

    const ratios = new Map<string, number>()
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const id = (entry.target as HTMLElement).getAttribute('data-chapter-id')
          if (id) ratios.set(id, entry.intersectionRatio)
        }
        let best: string | null = null
        let bestRatio = 0
        ratios.forEach((ratio, id) => {
          if (ratio > bestRatio) {
            bestRatio = ratio
            best = id
          }
        })
        setActiveChapterId(bestRatio > 0.08 ? best : null)
      },
      { threshold: [0, 0.08, 0.2, 0.4, 0.6, 1] },
    )

    slots.forEach((slot) => observer.observe(slot))
    return () => observer.disconnect()
  }, [])

  const showFab = import.meta.env.DEV || settings.panelOpen

  const patch = (next: Partial<StageArtifactTuneSettings>) => patchSettings(next)

  async function copyCss() {
    const text = formatStageTuneCss(settings)
    try {
      await navigator.clipboard.writeText(text)
      setCopyStatus('Copied CSS vars')
    } catch {
      setCopyStatus('Copy failed')
    }
    window.setTimeout(() => setCopyStatus(null), 1600)
  }

  if (!showFab && !settings.panelOpen) return null

  const activeHint = activeChapterId ? (
    <p className="stage-artifact-tune-panel__active">
      In view: <code>{activeChapterId}</code>
    </p>
  ) : null

  return (
    <>
      {!settings.panelOpen ? (
        <button
          type="button"
          className="stage-artifact-tune-fab"
          aria-label="Open stage size panel"
          onClick={() => patch({ panelOpen: true })}
        >
          Size
        </button>
      ) : null}

      {settings.panelOpen ? (
        <div
          ref={panelRef}
          className={`${panelClass}${dragging ? ' phone-layout-panel--dragging' : ''}`}
          style={panelStyle}
          role="dialog"
          aria-label="Stage artifact sizes"
        >
          <header
            className="phone-layout-panel__header"
            onPointerDown={onHeaderPointerDown}
            onPointerMove={onHeaderPointerMove}
            onPointerUp={onHeaderPointerUp}
            onPointerCancel={onHeaderPointerCancel}
          >
            <span className="phone-layout-panel__drag-hint" aria-hidden>
              ⋮⋮
            </span>
            <strong>Stage sizes</strong>
            <button
              type="button"
              className="phone-layout-panel__close"
              onClick={() => patch({ panelOpen: false })}
            >
              Close
            </button>
          </header>

          <div className="phone-layout-panel__scroll">
            <p className="phone-layout-panel__hint">
              Live sliders for phone swap, Sensi Lite proto, and EIM path art. Values persist in
              this browser.
            </p>

            {activeHint}

            <TuneSection
              legend="Phone swap (Mobile section)"
              hint="Scales the 3D viewbox. Right-click the phones for position / material tools."
            >
              <SliderRow
                label="Width"
                value={stageWidthPercent(settings.phoneWidth)}
                min={Math.round(STAGE_TUNE_LIMITS.phoneMin * 100)}
                max={Math.round(STAGE_TUNE_LIMITS.phoneMax * 100)}
                step={1}
                unit="%"
                onChange={(pct) => patch({ phoneWidth: pct / 100 })}
              />
              <SliderRow
                label="Height"
                value={stageSizePercent(settings.phoneHeight)}
                min={Math.round(STAGE_TUNE_LIMITS.phoneMin * 100)}
                max={Math.round(STAGE_TUNE_LIMITS.phoneMax * 100)}
                step={1}
                unit="%"
                onChange={(pct) => patch({ phoneHeight: pct / 100 })}
              />
            </TuneSection>

            <TuneSection legend="Sensi Lite proto (Hardware)">
              <SliderRow
                label="Max width"
                value={settings.sensiLiteMaxPx}
                min={STAGE_TUNE_LIMITS.sensiLiteMin}
                max={STAGE_TUNE_LIMITS.sensiLiteMax}
                step={4}
                unit="px"
                onChange={(sensiLiteMaxPx) => patch({ sensiLiteMaxPx })}
              />
            </TuneSection>

            <TuneSection legend="EIM path art (Hardware)">
              <SliderRow
                label="Max width"
                value={settings.eimMaxPx}
                min={STAGE_TUNE_LIMITS.eimMin}
                max={STAGE_TUNE_LIMITS.eimMax}
                step={4}
                unit="px"
                onChange={(eimMaxPx) => patch({ eimMaxPx })}
              />
            </TuneSection>

            <div className="phone-layout-panel__row phone-layout-panel__row--actions">
              <button type="button" className="is-primary" onClick={copyCss}>
                Copy CSS vars
              </button>
              <button type="button" onClick={resetSettings}>
                Reset defaults
              </button>
            </div>

            {copyStatus ? (
              <p className="phone-layout-panel__status">{copyStatus}</p>
            ) : null}
          </div>
        </div>
      ) : null}
    </>
  )
}
