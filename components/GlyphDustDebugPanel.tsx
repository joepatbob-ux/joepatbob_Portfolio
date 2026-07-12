'use client'

import { useCallback, useEffect, useState, type CSSProperties } from 'react'
import type { GlyphDustChromeTune, GlyphDustRecipe } from '@/lib/glyph-dust/createGlyphDust'
import {
  DEFAULT_CHROME_TUNE,
  DEFAULT_GLYPH_DUST_RECIPE,
  buildGlyphDustDebugPackage,
  formatGlyphDustDebugPackage,
  holdPhaseCenter,
  isChromiumBrowser,
  morphPhaseMidpoint,
  type GlyphDustDebugState,
} from '@/lib/glyph-dust/glyphDustDebug'

interface GlyphDustDebugPanelProps {
  state: GlyphDustDebugState
  canvasPx: number
  onChange(next: GlyphDustDebugState): void
}

type NumKey = keyof Pick<
  GlyphDustRecipe,
  | 'shapeDens'
  | 'dotSize'
  | 'cloudDot'
  | 'hold'
  | 'flow'
  | 'stagger'
  | 'shimmer'
  | 'goo'
  | 'curve'
  | 'errant'
>

const RECIPE_FIELDS: {
  key: NumKey
  label: string
  min: number
  max: number
  step: number
}[] = [
  { key: 'shapeDens', label: 'shapeDens', min: 40, max: 140, step: 0.1 },
  { key: 'dotSize', label: 'dotSize', min: 0.02, max: 0.12, step: 0.005 },
  { key: 'cloudDot', label: 'cloudDot', min: 0.01, max: 0.08, step: 0.005 },
  { key: 'hold', label: 'hold (ms)', min: 400, max: 3000, step: 50 },
  { key: 'flow', label: 'flow (ms)', min: 1500, max: 10000, step: 100 },
  { key: 'stagger', label: 'stagger', min: 0, max: 1, step: 0.05 },
  { key: 'shimmer', label: 'shimmer', min: 0, max: 2, step: 0.05 },
  { key: 'goo', label: 'goo (blur px)', min: 0, max: 20, step: 0.5 },
  { key: 'curve', label: 'curve', min: 0, max: 4, step: 0.1 },
  { key: 'errant', label: 'errant', min: 0, max: 80, step: 1 },
]

const GLYPHS = ['Hardware', 'Mobile', 'WebApp', 'Between'] as const

function panelStyle(): CSSProperties {
  return {
    position: 'fixed',
    right: 12,
    bottom: 12,
    zIndex: 100000,
    width: 320,
    maxHeight: 'min(88vh, 720px)',
    overflow: 'auto',
    padding: 12,
    borderRadius: 10,
    background: 'rgba(18, 18, 20, 0.94)',
    color: '#f2f2f2',
    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
    fontSize: 11,
    lineHeight: 1.35,
    boxShadow: '0 12px 40px rgba(0,0,0,0.45)',
    border: '1px solid rgba(255,255,255,0.12)',
  }
}

function rowStyle(): CSSProperties {
  return { display: 'grid', gridTemplateColumns: '1fr 56px', gap: 8, alignItems: 'center', marginBottom: 6 }
}

export function GlyphDustDebugPanel({ state, canvasPx, onChange }: GlyphDustDebugPanelProps) {
  const [copyStatus, setCopyStatus] = useState<'idle' | 'ok' | 'err'>('idle')
  const isChromium = isChromiumBrowser()

  const setRecipeValue = useCallback(
    (key: NumKey, value: number) => {
      onChange({ ...state, recipe: { ...state.recipe, [key]: value } })
    },
    [onChange, state],
  )

  const setChromeValue = useCallback(
    (key: keyof GlyphDustChromeTune, value: number) => {
      onChange({ ...state, chrome: { ...state.chrome, [key]: value } })
    },
    [onChange, state],
  )

  useEffect(() => {
    if (copyStatus === 'idle') return
    const t = window.setTimeout(() => setCopyStatus('idle'), 2000)
    return () => window.clearTimeout(t)
  }, [copyStatus])

  const copyPackage = async () => {
    const text = formatGlyphDustDebugPackage(
      buildGlyphDustDebugPackage(state, canvasPx),
    )
    try {
      await navigator.clipboard.writeText(text)
      setCopyStatus('ok')
    } catch {
      setCopyStatus('err')
    }
  }

  const resetDefaults = () => {
    onChange({
      recipe: { ...DEFAULT_GLYPH_DUST_RECIPE },
      chrome: { ...DEFAULT_CHROME_TUNE },
      phase: holdPhaseCenter(1),
      paused: true,
    })
  }

  return (
    <div style={panelStyle()} role="region" aria-label="Glyph dust debug panel">
      <div style={{ marginBottom: 10 }}>
        <strong style={{ fontSize: 12 }}>Glyph dust debug</strong>
        <div style={{ opacity: 0.7, marginTop: 4 }}>
          {isChromium ? 'Chromium path' : 'Safari path'} · canvas {canvasPx}px
        </div>
      </div>

      <div style={{ marginBottom: 10 }}>
        <label style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 6 }}>
          <input
            type="checkbox"
            checked={state.paused}
            onChange={(e) => {
              const paused = e.target.checked
              onChange({ ...state, paused })
            }}
          />
          Pause cycle (scrub phase)
        </label>
        <div style={rowStyle()}>
          <input
            type="range"
            min={0}
            max={1}
            step={0.001}
            value={state.phase}
            onChange={(e) => onChange({ ...state, phase: Number(e.target.value), paused: true })}
            style={{ width: '100%' }}
          />
          <span>{state.phase.toFixed(3)}</span>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
          {GLYPHS.map((name, i) => (
            <button
              key={name}
              type="button"
              onClick={() =>
                onChange({
                  ...state,
                  phase: holdPhaseCenter(i, state.recipe),
                  paused: true,
                })
              }
              style={chipStyle()}
            >
              {name}
            </button>
          ))}
          <button
            type="button"
            onClick={() =>
              onChange({
                ...state,
                phase: morphPhaseMidpoint(1, state.recipe),
                paused: true,
              })
            }
            style={chipStyle()}
          >
            Morph
          </button>
        </div>
      </div>

      <div style={{ marginBottom: 10 }}>
        <div style={{ opacity: 0.8, marginBottom: 6 }}>Recipe</div>
        {RECIPE_FIELDS.map(({ key, label, min, max, step }) => (
          <div key={key} style={rowStyle()}>
            <label>
              {label}
              <input
                type="range"
                min={min}
                max={max}
                step={step}
                value={state.recipe[key]}
                onChange={(e) => setRecipeValue(key, Number(e.target.value))}
                style={{ width: '100%', display: 'block', marginTop: 2 }}
              />
            </label>
            <input
              type="number"
              min={min}
              max={max}
              step={step}
              value={state.recipe[key]}
              onChange={(e) => setRecipeValue(key, Number(e.target.value))}
              style={numInputStyle()}
            />
          </div>
        ))}
      </div>

      <div style={{ marginBottom: 10 }}>
        <div style={{ opacity: 0.8, marginBottom: 6 }}>
          Chrome tune {isChromium ? '' : '(stored; Safari ignores)'}
        </div>
        <div style={rowStyle()}>
          <label>
            gooMult
            <input
              type="range"
              min={0.3}
              max={1}
              step={0.01}
              value={state.chrome.gooMult}
              onChange={(e) => setChromeValue('gooMult', Number(e.target.value))}
              style={{ width: '100%', display: 'block', marginTop: 2 }}
            />
          </label>
          <input
            type="number"
            min={0.3}
            max={1}
            step={0.01}
            value={state.chrome.gooMult}
            onChange={(e) => setChromeValue('gooMult', Number(e.target.value))}
            style={numInputStyle()}
          />
        </div>
        <div style={rowStyle()}>
          <label>
            threshold
            <input
              type="range"
              min={60}
              max={160}
              step={1}
              value={state.chrome.threshold}
              onChange={(e) => setChromeValue('threshold', Number(e.target.value))}
              style={{ width: '100%', display: 'block', marginTop: 2 }}
            />
          </label>
          <input
            type="number"
            min={60}
            max={160}
            step={1}
            value={state.chrome.threshold}
            onChange={(e) => setChromeValue('threshold', Number(e.target.value))}
            style={numInputStyle()}
          />
        </div>
      </div>

      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        <button type="button" onClick={copyPackage} style={buttonStyle()}>
          {copyStatus === 'ok' ? 'Copied!' : copyStatus === 'err' ? 'Copy failed' : 'Copy package'}
        </button>
        <button type="button" onClick={resetDefaults} style={buttonStyle()}>
          Reset
        </button>
      </div>
      <p style={{ opacity: 0.65, margin: '10px 0 0' }}>
        Add <code>?glyphDustDebug=1</code> on localhost. Paste the copied JSON in chat.
        Low <code>goo</code> exposes long transit arcs — keep goo ≥ 10 to judge the fluid look.
      </p>
    </div>
  )
}

function chipStyle(): CSSProperties {
  return {
    border: '1px solid rgba(255,255,255,0.2)',
    background: 'rgba(255,255,255,0.08)',
    color: '#fff',
    borderRadius: 6,
    padding: '4px 6px',
    fontSize: 10,
    cursor: 'pointer',
  }
}

function buttonStyle(): CSSProperties {
  return {
    border: '1px solid rgba(255,255,255,0.25)',
    background: 'rgba(255,255,255,0.12)',
    color: '#fff',
    borderRadius: 6,
    padding: '6px 10px',
    fontSize: 11,
    cursor: 'pointer',
  }
}

function numInputStyle(): CSSProperties {
  return {
    width: '100%',
    background: 'rgba(255,255,255,0.08)',
    border: '1px solid rgba(255,255,255,0.15)',
    color: '#fff',
    borderRadius: 4,
    padding: '2px 4px',
    fontSize: 11,
  }
}
