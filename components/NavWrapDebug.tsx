import { useEffect, useLayoutEffect, useState, type RefObject } from 'react'
import { createPortal } from 'react-dom'
import {
  isNavWrapDebugEnabled,
  measureNavWrap,
  navWrapLineColor,
  type NavWrapMeasure,
} from '@/lib/navWrapDebug'

function panelStyle() {
  return {
    position: 'fixed' as const,
    left: 12,
    bottom: 12,
    zIndex: 100001,
    width: 320,
    maxHeight: 'min(55vh, 420px)',
    overflow: 'auto' as const,
    padding: 12,
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

function NavWrapDebugPanel({ measure }: { measure: NavWrapMeasure }) {
  return (
    <div style={panelStyle()} role="region" aria-label="Nav wrap debug">
      <div style={{ fontWeight: 700, marginBottom: 8 }}>Nav wrap debug</div>
      <div style={{ opacity: 0.75, marginBottom: 10 }}>
        Edit breaks with <code>?navSentence=1</code> or in{' '}
        <code>lib/navSentenceLayout.ts</code>. Remove <code>?navWrapDebug=1</code> to
        hide.
      </div>
      <div style={{ marginBottom: 8 }}>
        Container: <strong>{measure.containerWidth}px</strong> · Intentional:{' '}
        <strong>{measure.intentionalLines.length}</strong> · Visual:{' '}
        <strong>{measure.lineCount}</strong>
        {measure.lineCount > measure.intentionalLines.length ? (
          <span style={{ color: '#ff8a8a' }}> (overflow wraps)</span>
        ) : null}
      </div>

      <div style={{ fontWeight: 600, marginBottom: 4 }}>Intentional lines</div>
      <ol style={{ margin: '0 0 10px 1.1em', padding: 0 }}>
        {measure.intentionalLines.map((line) => (
          <li
            key={line.id}
            style={{
              marginBottom: 4,
              color: line.overflows ? '#ff8a8a' : undefined,
            }}
          >
            <code>{line.id}</code> ({line.width}px / {measure.containerWidth}px,{' '}
            {Math.round(line.height)}px tall): {line.text || '—'}
            {line.overflows ? ' — overflows' : ''}
          </li>
        ))}
      </ol>

      <div style={{ fontWeight: 600, marginBottom: 4 }}>Visual lines</div>
      <ol style={{ margin: '0 0 10px 1.1em', padding: 0 }}>
        {measure.lines.map((line) => (
          <li key={line.index} style={{ marginBottom: 4 }}>
            <span
              style={{
                display: 'inline-block',
                width: 10,
                height: 10,
                borderRadius: 2,
                marginRight: 6,
                verticalAlign: 'middle',
                background: navWrapLineColor(line.index),
                border: '1px solid rgba(255,255,255,0.2)',
              }}
            />
            L{line.index + 1} ({Math.round(line.height)}px): {line.text || '—'}
          </li>
        ))}
      </ol>

      {measure.breaks.length > 0 ? (
        <>
          <div style={{ fontWeight: 600, marginBottom: 4 }}>Wrap breaks</div>
          <ul style={{ margin: '0 0 10px 1.1em', padding: 0 }}>
            {measure.breaks.map((brk, i) => (
              <li key={i} style={{ marginBottom: 3 }}>
                After L{brk.lineIndex + 1}: …{brk.after || '(start)'}
              </li>
            ))}
          </ul>
        </>
      ) : null}

      <div style={{ fontWeight: 600, marginBottom: 4 }}>Nowrap groups</div>
      <ul style={{ margin: 0, padding: '0 0 0 1.1em' }}>
        {measure.nowrapGroups.map((group, i) => (
          <li
            key={i}
            style={{
              marginBottom: 3,
              color: group.overflows ? '#ff8a8a' : undefined,
            }}
          >
            {group.className}: {group.width}px
            {group.overflows ? ' (overflows container)' : ''}
            <div style={{ opacity: 0.8 }}>{group.label}</div>
          </li>
        ))}
      </ul>
    </div>
  )
}

function NavWrapDebugLayers({
  root,
  measure,
}: {
  root: HTMLElement
  measure: NavWrapMeasure
}) {
  const navRect = root.getBoundingClientRect()

  return (
    <div className="sidebar-main-nav__wrap-debug-layer" aria-hidden>
      {measure.lines.map((line) => (
        <div
          key={line.index}
          className="sidebar-main-nav__wrap-debug-line"
          style={{
            top: line.top - navRect.top,
            left: 0,
            width: '100%',
            height: line.height,
            background: navWrapLineColor(line.index),
          }}
        >
          <span
            className="sidebar-main-nav__wrap-debug-badge"
            style={{ top: line.top - navRect.top }}
          >
            L{line.index + 1}
          </span>
        </div>
      ))}
      {measure.breaks.map((brk, i) => (
        <div
          key={i}
          className="sidebar-main-nav__wrap-debug-break"
          style={{
            left: brk.x - navRect.left - 1,
            top: brk.y - navRect.top - 2,
          }}
          title={`Break after: ${brk.after}`}
        />
      ))}
    </div>
  )
}

export function useNavWrapDebug(rootRef: RefObject<HTMLElement | null>) {
  const [enabled, setEnabled] = useState(false)
  const [measure, setMeasure] = useState<NavWrapMeasure | null>(null)
  const [root, setRoot] = useState<HTMLElement | null>(null)

  useEffect(() => {
    setEnabled(isNavWrapDebugEnabled())
  }, [])

  useEffect(() => {
    setRoot(rootRef.current)
  })

  useEffect(() => {
    if (!root) return
    if (enabled) root.classList.add('sidebar-main-nav__sentence--wrap-debug')
    else root.classList.remove('sidebar-main-nav__sentence--wrap-debug')
    return () => root.classList.remove('sidebar-main-nav__sentence--wrap-debug')
  }, [root, enabled])

  const remeasure = () => {
    if (!root || !enabled) return
    setMeasure(measureNavWrap(root))
  }

  useLayoutEffect(() => {
    if (!root || !enabled) {
      setMeasure(null)
      return
    }

    remeasure()

    const ro = new ResizeObserver(() => remeasure())
    ro.observe(root)

    const onResize = () => remeasure()
    window.addEventListener('resize', onResize)

    const fonts = document.fonts
    fonts?.ready?.then(remeasure)

    return () => {
      ro.disconnect()
      window.removeEventListener('resize', onResize)
    }
  }, [root, enabled])

  return { enabled, measure, root }
}

export function NavWrapDebug({
  rootRef,
}: {
  rootRef: RefObject<HTMLElement | null>
}) {
  const { enabled, measure, root } = useNavWrapDebug(rootRef)

  if (!enabled || !root || !measure) return null

  return (
    <>
      <NavWrapDebugLayers root={root} measure={measure} />
      {createPortal(<NavWrapDebugPanel measure={measure} />, document.body)}
    </>
  )
}
