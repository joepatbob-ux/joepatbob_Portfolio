import { useState } from 'react'
import { useNavSentenceLayout } from '@/components/NavSentenceLayoutProvider'
import { NAV_SECTIONS } from '@/lib/nav'
import { NAV_SENTENCE_KEYWORD_HINT } from '@/lib/navSentenceLayout'

const sectionById = new Map(NAV_SECTIONS.map((sec) => [sec.id, sec]))

function panelStyle() {
  return {
    position: 'fixed' as const,
    right: 12,
    top: 12,
    zIndex: 100001,
    width: 360,
    maxHeight: 'min(80vh, 640px)',
    overflow: 'auto' as const,
    padding: 14,
    borderRadius: 10,
    background: 'rgba(18, 18, 20, 0.94)',
    color: '#f2f2f2',
    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
    fontSize: 11,
    lineHeight: 1.45,
    boxShadow: '0 12px 40px rgba(0,0,0,0.45)',
    border: '1px solid rgba(255,255,255,0.12)',
  }
}

function btnStyle(primary = false) {
  return {
    padding: '7px 11px',
    borderRadius: 6,
    border: primary
      ? '1px solid rgba(120, 200, 255, 0.55)'
      : '1px solid rgba(255,255,255,0.2)',
    background: primary ? 'rgba(80, 160, 255, 0.22)' : 'rgba(255,255,255,0.08)',
    color: '#f2f2f2',
    font: 'inherit',
    cursor: 'pointer',
  } as const
}

function previewStyle() {
  return {
    marginTop: 10,
    padding: '10px 12px',
    borderRadius: 8,
    border: '1px solid rgba(255,255,255,0.14)',
    background: 'rgba(255,255,255,0.04)',
    fontFamily: 'var(--font-ahg), system-ui, sans-serif',
    fontWeight: 700,
    fontSize: 15,
    lineHeight: 1.2,
    letterSpacing: '0.01em',
    textTransform: 'uppercase' as const,
    color: 'var(--color-ink, #f2f2f2)',
    width: 224,
    maxWidth: '100%',
  }
}

export function NavSentenceEditorPanel() {
  const {
    editorEnabled,
    draftText,
    isLocked,
    lines,
    setDraftText,
    lockIn,
    resetToDefault,
    copyTypeScript,
  } = useNavSentenceLayout()
  const [copied, setCopied] = useState(false)
  const [lockedFlash, setLockedFlash] = useState(false)

  if (!editorEnabled) return null

  return (
    <div style={panelStyle()} role="dialog" aria-label="Nav sentence editor">
      <div style={{ fontWeight: 700, fontSize: 12, marginBottom: 6 }}>
        Nav sentence editor
      </div>
      <div style={{ opacity: 0.75, marginBottom: 10 }}>
        One line per row. Sidebar updates live. Remove <code>?navSentence=1</code>{' '}
        when done.
      </div>

      <label htmlFor="nav-sentence-editor" style={{ fontWeight: 600 }}>
        Format
      </label>
      <textarea
        id="nav-sentence-editor"
        value={draftText}
        onChange={(e) => setDraftText(e.target.value)}
        spellCheck={false}
        style={{
          display: 'block',
          width: '100%',
          minHeight: 120,
          marginTop: 6,
          marginBottom: 8,
          padding: 10,
          borderRadius: 8,
          border: '1px solid rgba(255,255,255,0.18)',
          background: 'rgba(0,0,0,0.35)',
          color: '#f8f8f8',
          font: 'inherit',
          lineHeight: 1.5,
          resize: 'vertical',
        }}
      />

      <div style={{ opacity: 0.8, marginBottom: 10 }}>
        Keep keywords exact: {NAV_SENTENCE_KEYWORD_HINT}
      </div>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <button
          type="button"
          style={btnStyle(true)}
          onClick={() => {
            lockIn()
            setLockedFlash(true)
            window.setTimeout(() => setLockedFlash(false), 1600)
          }}
        >
          Lock in
        </button>
        <button type="button" style={btnStyle()} onClick={() => resetToDefault()}>
          Reset
        </button>
        <button
          type="button"
          style={btnStyle()}
          onClick={async () => {
            const ok = await copyTypeScript()
            setCopied(ok)
            window.setTimeout(() => setCopied(false), 1600)
          }}
        >
          Copy TS
        </button>
      </div>

      <div style={{ marginTop: 8, minHeight: 16, opacity: 0.9 }}>
        {lockedFlash ? 'Locked — saved for this browser.' : null}
        {!lockedFlash && copied ? 'TypeScript copied.' : null}
        {!lockedFlash && !copied && isLocked ? 'Using locked layout.' : null}
      </div>

      <div style={{ fontWeight: 600, marginTop: 12, marginBottom: 6 }}>
        Preview ({lines.length} line{lines.length === 1 ? '' : 's'})
      </div>
      <div style={previewStyle()} aria-hidden>
        {lines.map((line) => (
          <span
            key={line.id}
            style={{ display: 'block' }}
            data-nav-line-preview={line.id}
          >
            {line.kind === 'text' ? (
              line.text
            ) : (
              <>
                {line.prefix ? (
                  <span style={{ color: 'var(--color-ink, #ddd)' }}>{line.prefix}</span>
                ) : null}
                {line.sectionIds.map((sectionId, index) => (
                  <span key={sectionId}>
                    <span style={{ color: 'var(--color-accent, #ff6a2a)' }}>
                      {sectionById.get(sectionId)?.label ?? sectionId}
                    </span>
                    {index < line.sectionIds.length - 1
                      ? (line.between?.[index] ?? ', ')
                      : ''}
                    {sectionId === 'everything-else' &&
                    (!line.suffix || line.suffix === '.') ? (
                      <span style={{ color: 'var(--color-ink, #ddd)' }}>.</span>
                    ) : null}
                  </span>
                ))}
                {line.suffix && line.suffix !== '.' ? (
                  <span style={{ color: 'var(--color-ink, #ddd)' }}>{line.suffix}</span>
                ) : null}
              </>
            )}
          </span>
        ))}
      </div>
    </div>
  )
}
