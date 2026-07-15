import { useEffect, useState, type CSSProperties } from 'react'

/**
 * Fade-tune dials (`?fadeTune=1`) — live controls for the prerender-ghost
 * load dissolve and the placed-sticker scroll exit. Values write to CSS
 * custom properties immediately and persist to localStorage, which main.tsx
 * reads before the ghost mounts, so a plain reload tests the dialed load
 * dissolve end to end. Unlike the dev panels this ships behind its query
 * param only (no NODE_ENV gate) so it works on preview deploys.
 */

const STORAGE_KEY = 'fade-tune'

export type FadeTuneState = {
  ghostMs: number
  ghostBlur: number
  ghostHold: number
  stickerMs: number
  stickerBlur: number
}

export const FADE_TUNE_DEFAULTS: FadeTuneState = {
  ghostMs: 320,
  ghostBlur: 8,
  ghostHold: 0,
  stickerMs: 320,
  stickerBlur: 8,
}

function loadState(): FadeTuneState {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return { ...FADE_TUNE_DEFAULTS }
    const parsed = JSON.parse(raw) as Partial<FadeTuneState>
    return { ...FADE_TUNE_DEFAULTS, ...parsed }
  } catch {
    return { ...FADE_TUNE_DEFAULTS }
  }
}

function applyVars(state: FadeTuneState): void {
  const s = document.documentElement.style
  s.setProperty('--ghost-fade-duration', `${state.ghostMs}ms`)
  s.setProperty('--ghost-fade-blur', `${state.ghostBlur}px`)
  s.setProperty('--sticker-exit-duration', `${state.stickerMs}ms`)
  s.setProperty('--sticker-exit-blur', `${state.stickerBlur}px`)
}

function replayGhost(state: FadeTuneState): void {
  const root = document.getElementById('root')
  if (!root) return
  document.querySelector('.prerender-ghost')?.remove()
  const ghost = document.createElement('div')
  ghost.className = 'prerender-ghost'
  ghost.setAttribute('aria-hidden', 'true')
  const copy = root.cloneNode(true) as HTMLElement
  copy.removeAttribute('id')
  copy.querySelector('[data-fade-tune-panel]')?.remove()
  ghost.appendChild(copy)
  document.body.appendChild(ghost)
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      window.setTimeout(() => {
        ghost.classList.add('prerender-ghost--out')
      }, state.ghostHold)
    })
  })
  window.setTimeout(() => ghost.remove(), state.ghostHold + state.ghostMs + 150)
}

const panelStyle: CSSProperties = {
  position: 'fixed',
  right: 12,
  bottom: 12,
  zIndex: 600,
  width: 264,
  padding: 12,
  borderRadius: 10,
  background: 'rgba(20, 20, 20, 0.92)',
  color: '#eee',
  fontFamily: 'ui-monospace, monospace',
  fontSize: 11,
  lineHeight: 1.5,
  boxShadow: '0 6px 24px rgba(0, 0, 0, 0.4)',
}

const buttonStyle: CSSProperties = {
  padding: '4px 10px',
  borderRadius: 6,
  border: '1px solid rgba(255, 255, 255, 0.3)',
  background: 'transparent',
  color: '#eee',
  font: 'inherit',
  cursor: 'pointer',
}

function Dial({
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
  onChange: (v: number) => void
}) {
  return (
    <label style={{ display: 'block', marginBottom: 6 }}>
      <span style={{ display: 'flex', justifyContent: 'space-between' }}>
        <span>{label}</span>
        <span style={{ opacity: 0.75 }}>
          {value}
          {unit}
        </span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{ width: '100%' }}
      />
    </label>
  )
}

export function FadeTunePanel() {
  const [state, setState] = useState<FadeTuneState>(loadState)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    applyVars(state)
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    } catch {
      /* private-mode storage failures are fine */
    }
  }, [state])

  useEffect(() => {
    if (!copied) return
    const t = window.setTimeout(() => setCopied(false), 1500)
    return () => window.clearTimeout(t)
  }, [copied])

  const set = (patch: Partial<FadeTuneState>) =>
    setState((prev) => ({ ...prev, ...patch }))

  return (
    <div style={panelStyle} data-fade-tune-panel role="region" aria-label="Fade tuning">
      <strong style={{ fontSize: 12 }}>Fade tuning</strong>

      <div style={{ margin: '8px 0 2px', opacity: 0.75 }}>Load dissolve (ghost)</div>
      <Dial label="Duration" value={state.ghostMs} min={80} max={1600} step={20} unit="ms" onChange={(v) => set({ ghostMs: v })} />
      <Dial label="Blur" value={state.ghostBlur} min={0} max={32} step={1} unit="px" onChange={(v) => set({ ghostBlur: v })} />
      <Dial label="Hold before fade" value={state.ghostHold} min={0} max={1500} step={50} unit="ms" onChange={(v) => set({ ghostHold: v })} />

      <div style={{ margin: '8px 0 2px', opacity: 0.75 }}>Sticker exit</div>
      <Dial label="Duration" value={state.stickerMs} min={80} max={1200} step={20} unit="ms" onChange={(v) => set({ stickerMs: v })} />
      <Dial label="Blur" value={state.stickerBlur} min={0} max={24} step={1} unit="px" onChange={(v) => set({ stickerBlur: v })} />

      <div style={{ display: 'flex', gap: 6, marginTop: 10, flexWrap: 'wrap' }}>
        <button type="button" style={buttonStyle} onClick={() => replayGhost(state)}>
          Replay dissolve
        </button>
        <button
          type="button"
          style={buttonStyle}
          onClick={() => {
            void navigator.clipboard
              .writeText(JSON.stringify(state))
              .then(() => setCopied(true))
              .catch(() => {})
          }}
        >
          {copied ? 'Copied ✓' : 'Copy values'}
        </button>
        <button
          type="button"
          style={buttonStyle}
          onClick={() => {
            try {
              window.localStorage.removeItem(STORAGE_KEY)
            } catch {
              /* ignore */
            }
            setState({ ...FADE_TUNE_DEFAULTS })
          }}
        >
          Reset
        </button>
      </div>
      <div style={{ marginTop: 8, opacity: 0.6 }}>
        Values persist on this device — reload to test the real load dissolve.
        Scroll past a placed sticker to feel the exit.
      </div>
    </div>
  )
}
