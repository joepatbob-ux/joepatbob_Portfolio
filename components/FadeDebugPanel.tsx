import { useEffect, useRef, useState, type CSSProperties } from 'react'

import { FADE_TUNE_DEFAULTS, type FadeTuneState } from '@/components/FadeTunePanel'
import { activeSlideIdPublished } from '@/lib/scroll/chapterSlideshow'

/**
 * Live fade diagnostics (`?fadeDebug=1`) — read-only companion to the
 * ?fadeTune=1 dials. Shows what the fade system is actually doing on THIS
 * device: computed opacity/filter of every scroll-faded text element, the
 * reduced-motion state, and — critically — any persisted fade-tune
 * localStorage overrides silently applied on load (a dial left at blur 0
 * kills the text blur on this browser only, invisible everywhere else).
 * Ships behind its query param only (no NODE_ENV gate) so it works on
 * production and previews.
 */

type Row = { label: string; value: string; warn?: boolean }

function readOverrides(): Partial<FadeTuneState> | null {
  try {
    const raw = window.localStorage.getItem('fade-tune')
    if (!raw) return null
    return JSON.parse(raw) as Partial<FadeTuneState>
  } catch {
    return null
  }
}

function overrideDiff(): { text: string; changed: boolean } {
  const stored = readOverrides()
  if (!stored) return { text: 'none', changed: false }
  const diffs = Object.entries(stored)
    .filter(([k, v]) => v !== FADE_TUNE_DEFAULTS[k as keyof FadeTuneState])
    .map(([k, v]) => `${k}=${v}`)
  if (diffs.length === 0) return { text: 'stored (all defaults)', changed: false }
  return { text: diffs.join(' '), changed: true }
}

function fmt(el: Element | null): string {
  if (!el) return '(missing)'
  const cs = getComputedStyle(el)
  const blur = /blur\(([\d.]+)px\)/.exec(cs.filter)
  return `op ${Number(cs.opacity).toFixed(2)} · blur ${blur ? Number(blur[1]).toFixed(1) : '0'}px`
}

function sample(): Row[] {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const diff = overrideDiff()
  const activeId = activeSlideIdPublished()
  const activeSlot = activeId
    ? document.querySelector(`[data-chapter-id="${activeId}"]`)
    : null
  const pin = document.querySelector('#hero .hero-pin')
  const rows: Row[] = [
    {
      label: 'fade-tune overrides',
      value: diff.text,
      warn: diff.changed,
    },
    {
      label: 'reduced motion',
      value: reduced ? 'ON — all blur disabled by design' : 'off',
      warn: reduced,
    },
    { label: 'scrollY / vh', value: `${Math.round(window.scrollY)} / ${window.innerHeight}` },
    { label: 'hero pin', value: fmt(pin) },
    {
      label: 'hero blur layer',
      value: fmt(document.querySelector('.hero-media-blur')),
    },
    { label: 'sidebar name', value: fmt(document.querySelector('.sidebar-hero-name')) },
    {
      label: `copy (${activeId ?? 'none'})`,
      value: fmt(activeSlot?.querySelector('.chapter-slide__copy') ?? null),
    },
    {
      label: 'copyScrollBlur dataset',
      value: document.documentElement.dataset.copyScrollBlur ?? '(default 12)',
      warn: document.documentElement.dataset.copyScrollBlur === '0',
    },
  ]
  return rows
}

const panelStyle: CSSProperties = {
  position: 'fixed',
  top: 12,
  left: 12,
  zIndex: 601,
  maxWidth: 340,
  padding: '10px 12px',
  borderRadius: 8,
  background: 'rgba(10, 10, 10, 0.88)',
  color: '#e8e8e8',
  font: '11px/1.5 ui-monospace, SFMono-Regular, Menlo, monospace',
  pointerEvents: 'auto',
}

export function FadeDebugPanel() {
  const [rows, setRows] = useState<Row[]>([])
  const [copied, setCopied] = useState(false)
  const rowsRef = useRef<Row[]>([])

  useEffect(() => {
    let raf = 0
    let lastPush = 0
    const tick = (t: number) => {
      // Sample every frame, re-render at ~7Hz so the panel itself stays cheap.
      rowsRef.current = sample()
      if (t - lastPush > 150) {
        lastPush = t
        setRows(rowsRef.current)
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [])

  const copyReport = () => {
    const report = rowsRef.current
      .map((r) => `${r.label}: ${r.value}${r.warn ? '  ⚠️' : ''}`)
      .join('\n')
    void navigator.clipboard?.writeText(report).then(() => {
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1500)
    })
  }

  const clearOverrides = () => {
    try {
      window.localStorage.removeItem('fade-tune')
    } catch {
      // Storage unavailable — nothing to clear.
    }
    window.location.reload()
  }

  return (
    <div style={panelStyle} data-fade-debug-panel role="region" aria-label="Fade diagnostics">
      <div style={{ fontWeight: 700, marginBottom: 6 }}>fade debug</div>
      {rows.map((r) => (
        <div key={r.label} style={{ display: 'flex', gap: 8, justifyContent: 'space-between' }}>
          <span style={{ opacity: 0.7 }}>{r.label}</span>
          <span style={{ color: r.warn ? '#ff8080' : undefined, textAlign: 'right' }}>
            {r.value}
          </span>
        </div>
      ))}
      <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
        <button type="button" onClick={copyReport} style={{ font: 'inherit' }}>
          {copied ? 'copied ✓' : 'copy report'}
        </button>
        <button type="button" onClick={clearOverrides} style={{ font: 'inherit' }}>
          clear overrides + reload
        </button>
      </div>
    </div>
  )
}
