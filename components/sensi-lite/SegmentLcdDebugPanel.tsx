import { useCallback, type CSSProperties } from 'react'
import type { SegmentPick } from '@/lib/sensi-lite/sensiLiteSegmentDebug'

function panelStyle(): CSSProperties {
  return {
    position: 'fixed',
    right: 12,
    bottom: 12,
    zIndex: 100001,
    width: 300,
    maxHeight: 'min(70vh, 520px)',
    overflow: 'auto',
    padding: 12,
    borderRadius: 10,
    background: 'rgba(18, 18, 20, 0.94)',
    color: '#f2f2f2',
    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
    fontSize: 11,
    lineHeight: 1.4,
    boxShadow: '0 12px 40px rgba(0,0,0,0.45)',
    border: '1px solid rgba(255,255,255,0.12)',
  }
}

function btnStyle(): CSSProperties {
  return {
    padding: '6px 10px',
    borderRadius: 6,
    border: '1px solid rgba(255,255,255,0.2)',
    background: 'rgba(255,255,255,0.08)',
    color: '#f2f2f2',
    font: 'inherit',
    cursor: 'pointer',
  }
}

function swatchStyle(fill: string): CSSProperties {
  return {
    width: 10,
    height: 10,
    borderRadius: 2,
    background: fill,
    border: '1px solid rgba(255,255,255,0.25)',
    flexShrink: 0,
  }
}

export function SegmentLcdDebugPanel({
  selectedPicks,
  idDraft,
  idCount,
  onIdDraftChange,
  onApplyId,
  onBreakApart,
  canBreakApart,
  onMerge,
  canMerge,
  onCopyIdMap,
  onCopySvg,
  onClearPick,
  onSelectAll,
}: {
  selectedPicks: SegmentPick[]
  idDraft: string
  idCount: number
  onIdDraftChange: (value: string) => void
  onApplyId: () => void
  onBreakApart: () => void
  canBreakApart: boolean
  onMerge: () => void
  canMerge: boolean
  onCopyIdMap: () => void
  onCopySvg: () => void
  onClearPick: () => void
  onSelectAll: () => void
}) {
  const onKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') onApplyId()
    },
    [onApplyId],
  )

  const hasSelection = selectedPicks.length > 0
  const sharedId =
    selectedPicks.length > 0
      ? [...new Set(selectedPicks.map((p) => p.id).filter(Boolean))]
      : []

  return (
    <div style={panelStyle()} role="region" aria-label="Sensi Lite segment debug">
      <div style={{ fontWeight: 600, marginBottom: 8, fontSize: 12 }}>Name segments</div>

      <ul style={{ margin: '0 0 10px', padding: 0, listStyle: 'none', opacity: 0.85 }}>
        <li style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 4 }}>
          <span style={swatchStyle('#fff')} aria-hidden />
          Unnamed
        </li>
        <li style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 4 }}>
          <span
            style={swatchStyle('color-mix(in srgb, var(--color-accent) 42%, white)')}
            aria-hidden
          />
          Named (saved id)
        </li>
        <li style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span style={swatchStyle('var(--color-accent)')} aria-hidden />
          Selected
        </li>
      </ul>

      <div
        style={{
          marginBottom: 10,
          padding: 8,
          borderRadius: 6,
          background: 'rgba(255,255,255,0.06)',
          minHeight: 52,
        }}
      >
        {!hasSelection ? (
          <div style={{ opacity: 0.55 }}>
            Click a segment · Shift+click to add/remove · Merge groups paths · Break apart ungroups
          </div>
        ) : (
          <>
            <div>
              <strong>
                {selectedPicks.length} selected
                {selectedPicks.length > 1 ? ' (merge or apply id)' : ''}
              </strong>
            </div>
            <ul
              style={{
                margin: '6px 0 0',
                padding: 0,
                listStyle: 'none',
                maxHeight: 88,
                overflow: 'auto',
                opacity: 0.85,
              }}
            >
              {selectedPicks.map((pick) => (
                <li key={pick.key} style={{ marginBottom: 2 }}>
                  {pick.tag}
                  {pick.idx !== null ? ` · idx ${pick.idx}` : ''}
                  {pick.id ? ` · ${pick.id}` : ''}
                </li>
              ))}
            </ul>
            {sharedId.length > 1 ? (
              <div style={{ opacity: 0.55, marginTop: 6 }}>mixed ids — enter a new shared id</div>
            ) : sharedId.length === 1 ? (
              <div style={{ opacity: 0.8, marginTop: 6 }}>current id: {sharedId[0]}</div>
            ) : null}
          </>
        )}
      </div>

      <label htmlFor="sensi-lite-seg-id" style={{ display: 'block', marginBottom: 4, fontWeight: 600 }}>
        Segment id
      </label>
      <input
        id="sensi-lite-seg-id"
        type="text"
        value={idDraft}
        onChange={(e) => onIdDraftChange(e.target.value)}
        onKeyDown={onKeyDown}
        placeholder="e.g. label-outdoor"
        disabled={!hasSelection}
        style={{
          width: '100%',
          boxSizing: 'border-box',
          marginBottom: 8,
          padding: '6px 8px',
          borderRadius: 6,
          border: '1px solid rgba(255,255,255,0.2)',
          background: 'rgba(0,0,0,0.35)',
          color: '#fff',
          font: 'inherit',
        }}
      />

      <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
        <button
          type="button"
          style={btnStyle()}
          onClick={onApplyId}
          disabled={!hasSelection || !idDraft.trim()}
        >
          Apply id{selectedPicks.length > 1 ? ` to ${selectedPicks.length}` : ''}
        </button>
        <button
          type="button"
          style={btnStyle()}
          onClick={onMerge}
          disabled={!canMerge}
          title="Combine selection into one group"
        >
          Merge{selectedPicks.length > 1 ? ` ${selectedPicks.length}` : ''}
        </button>
        <button
          type="button"
          style={btnStyle()}
          onClick={onBreakApart}
          disabled={!canBreakApart}
          title="Release paths from a named group"
        >
          Break apart
        </button>
        <button type="button" style={btnStyle()} onClick={onSelectAll}>
          Select all
        </button>
        {hasSelection ? (
          <button type="button" style={btnStyle()} onClick={onClearPick}>
            Clear
          </button>
        ) : null}
      </div>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
        <button type="button" style={btnStyle()} onClick={onCopyIdMap}>
          Copy id map ({idCount})
        </button>
        <button type="button" style={btnStyle()} onClick={onCopySvg}>
          Copy SVG
        </button>
      </div>

      <p style={{ margin: 0, opacity: 0.55, fontSize: 10 }}>
        digit-{'{tens|ones}'}-{'{seg}'} · icon-{'{name}'} · label-{'{word}'}
      </p>
    </div>
  )
}
