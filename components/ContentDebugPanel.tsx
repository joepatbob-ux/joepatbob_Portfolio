import { useCallback, useEffect, useMemo, useState, type CSSProperties } from 'react'
import { useChapterNav } from '@/components/ChapterNavProvider'
import { useContentDebug } from '@/components/ContentDebugProvider'
import { CONTENT_DEBUG_CATALOG } from '@/lib/content/contentDebugCatalog'
import {
  buildContentDebugPackage,
  formatContentDebugPackage,
  isContentDebugEnabled,
} from '@/lib/content/contentDebug'
import { usePublishedActiveSlideId } from '@/lib/hooks/useChapterReveal'
import { isInInterludeScrollZone } from '@/lib/scroll/heroScroll'

const { pages } = CONTENT_DEBUG_CATALOG

function panelStyle(): CSSProperties {
  return {
    position: 'fixed',
    left: 12,
    top: 12,
    zIndex: 100001,
    width: 'min(420px, calc(100vw - 24px))',
    maxHeight: 'min(88vh, 760px)',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
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

function buttonStyle(): CSSProperties {
  return {
    appearance: 'none',
    border: '1px solid rgba(255,255,255,0.16)',
    borderRadius: 6,
    padding: '6px 8px',
    background: 'rgba(255,255,255,0.06)',
    color: '#f2f2f2',
    font: 'inherit',
    cursor: 'pointer',
  }
}

function scrollToChapter(chapterId: string) {
  const el = document.querySelector<HTMLElement>(
    `[data-chapter-id="${chapterId}"]`,
  )
  if (!el) return
  el.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

/** Dev-only — add `?contentDebug=1` on localhost. */
export function ContentDebugPanel() {
  const [visible, setVisible] = useState(false)
  const [copyStatus, setCopyStatus] = useState<'idle' | 'ok' | 'err'>('idle')
  const {
    state,
    defaults,
    setOverride,
    clearPageOverrides,
    resetAllOverrides,
    setSelectedPageId,
    setFollowScroll,
  } = useContentDebug()
  const publishedSlideId = usePublishedActiveSlideId()
  const { navigateToChapter } = useChapterNav()

  useEffect(() => {
    setVisible(isContentDebugEnabled())
  }, [])

  const selectedPage = useMemo(
    () => pages.find((p) => p.id === state.selectedPageId) ?? pages[0]!,
    [state.selectedPageId],
  )

  useEffect(() => {
    if (!state.followScroll) return
    if (isInInterludeScrollZone()) {
      if (state.selectedPageId !== 'interlude') setSelectedPageId('interlude')
      return
    }
    if (!publishedSlideId) return
    const match = pages.find((p) => p.chapterId === publishedSlideId)
    if (match && match.id !== state.selectedPageId) {
      setSelectedPageId(match.id)
    }
  }, [
    publishedSlideId,
    state.followScroll,
    state.selectedPageId,
    setSelectedPageId,
  ])

  const fieldValue = useCallback(
    (key: string) => {
      if (key in state.overrides) return state.overrides[key]!
      return defaults[key] ?? ''
    },
    [state.overrides, defaults],
  )

  const isOverridden = useCallback(
    (key: string) => key in state.overrides,
    [state.overrides],
  )

  const copyPackage = useCallback(async () => {
    const fieldCount = Object.keys(state.overrides).length
    const pkg = buildContentDebugPackage(state.overrides, fieldCount, pages.length)
    try {
      await navigator.clipboard.writeText(formatContentDebugPackage(pkg))
      setCopyStatus('ok')
    } catch {
      setCopyStatus('err')
    }
  }, [state.overrides])

  useEffect(() => {
    if (copyStatus === 'idle') return
    const t = window.setTimeout(() => setCopyStatus('idle'), 2000)
    return () => window.clearTimeout(t)
  }, [copyStatus])

  const jumpToPage = useCallback(() => {
    if (!selectedPage.chapterId) {
      if (selectedPage.id === 'interlude') {
        document.getElementById('portfolio-interlude')?.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        })
      }
      return
    }
    void navigateToChapter(selectedPage.chapterId).then(() => {
      scrollToChapter(selectedPage.chapterId!)
    })
  }, [navigateToChapter, selectedPage])

  if (!visible) return null

  return (
    <div className="content-debug-panel" style={panelStyle()} role="dialog" aria-label="Content debug">
      <div style={{ padding: '10px 12px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
        <div style={{ fontWeight: 600, marginBottom: 6 }}>Content debug</div>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
          <span>Page</span>
          <select
            value={state.selectedPageId}
            onChange={(e) => setSelectedPageId(e.target.value)}
            style={{
              flex: 1,
              font: 'inherit',
              background: '#1a1a1c',
              color: '#f2f2f2',
              border: '1px solid rgba(255,255,255,0.15)',
              borderRadius: 6,
              padding: '4px 6px',
            }}
          >
            {pages.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label}
              </option>
            ))}
          </select>
        </label>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <button type="button" style={buttonStyle()} onClick={jumpToPage}>
            Jump to page
          </button>
          <label style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <input
              type="checkbox"
              checked={state.followScroll}
              onChange={(e) => setFollowScroll(e.target.checked)}
            />
            Follow scroll
          </label>
        </div>
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: '10px 12px' }}>
        {selectedPage.fields.map((f) => (
          <div key={f.key} style={{ marginBottom: 12 }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                gap: 8,
                marginBottom: 4,
              }}
            >
              <label htmlFor={`content-debug-${f.key}`} style={{ fontWeight: 600 }}>
                {f.label}
                {isOverridden(f.key) ? ' *' : ''}
              </label>
            </div>
            <div style={{ opacity: 0.55, marginBottom: 4, fontSize: 10 }}>{f.fileHint}</div>
            {f.multiline ? (
              <textarea
                id={`content-debug-${f.key}`}
                value={fieldValue(f.key)}
                onChange={(e) => setOverride(f.key, e.target.value)}
                rows={Math.min(12, Math.max(3, fieldValue(f.key).split('\n').length + 1))}
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  font: 'inherit',
                  background: '#111114',
                  color: '#f2f2f2',
                  border: '1px solid rgba(255,255,255,0.14)',
                  borderRadius: 6,
                  padding: 8,
                  resize: 'vertical',
                }}
              />
            ) : (
              <input
                id={`content-debug-${f.key}`}
                type="text"
                value={fieldValue(f.key)}
                onChange={(e) => setOverride(f.key, e.target.value)}
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  font: 'inherit',
                  background: '#111114',
                  color: '#f2f2f2',
                  border: '1px solid rgba(255,255,255,0.14)',
                  borderRadius: 6,
                  padding: '6px 8px',
                }}
              />
            )}
          </div>
        ))}
      </div>

      <div
        style={{
          padding: '10px 12px',
          borderTop: '1px solid rgba(255,255,255,0.1)',
          display: 'flex',
          gap: 6,
          flexWrap: 'wrap',
        }}
      >
        <button type="button" style={buttonStyle()} onClick={copyPackage}>
          {copyStatus === 'ok'
            ? 'Copied!'
            : copyStatus === 'err'
              ? 'Copy failed'
              : 'Copy overrides'}
        </button>
        <button
          type="button"
          style={buttonStyle()}
          onClick={() => clearPageOverrides(selectedPage.id)}
        >
          Reset page
        </button>
        <button type="button" style={buttonStyle()} onClick={resetAllOverrides}>
          Reset all
        </button>
      </div>
    </div>
  )
}
