import { useEffect, useMemo, useState } from 'react'
import { SegmentLcd } from '@/components/sensi-lite/SegmentLcd'
import { SegmentLcdDebugPanel } from '@/components/sensi-lite/SegmentLcdDebugPanel'
import { useHydrated } from '@/lib/hooks/useHydrated'
import { isSensiLiteSegmentDebugEnabled } from '@/lib/sensi-lite/sensiLiteSegmentDebug'
import { useSegmentLcdDebug } from '@/lib/sensi-lite/useSegmentLcdDebug'

/** Full-screen segment atlas — `?sensiLiteSegments=1` on localhost:3000 */
export function SensiLiteSegmentAtlas() {
  const hydrated = useHydrated()
  const [enabled, setEnabled] = useState(false)
  const {
    lcdRef,
    selectedPicks,
    selectedKeys,
    idDraft,
    idCount,
    namedRevision,
    setIdDraft,
    handleSegmentPick,
    handleApplySegmentId,
    handleBreakApart,
    canBreakApart,
    handleMerge,
    canMerge,
    handleCopyIdMap,
    handleCopySvg,
    clearPick,
    selectAllSegments,
    refreshIdCount,
  } = useSegmentLcdDebug()

  const selectedKeySet = useMemo(() => new Set(selectedKeys), [selectedKeys])

  useEffect(() => {
    if (!hydrated) return
    setEnabled(isSensiLiteSegmentDebugEnabled())
  }, [hydrated])

  useEffect(() => {
    if (!enabled) return
    const timer = window.setTimeout(() => refreshIdCount(), 120)
    return () => window.clearTimeout(timer)
  }, [enabled, refreshIdCount])

  if (!enabled) return null

  return (
    <div className="sensi-lite-segment-atlas" role="application" aria-label="Sensi Lite segment atlas">
      <header className="sensi-lite-segment-atlas__header">
        <div>
          <strong className="sensi-lite-segment-atlas__title">Segment atlas</strong>
          <p className="sensi-lite-segment-atlas__hint">
            Click to select · Shift+click to add/remove · Merge combines · Break apart ungroups
          </p>
        </div>
        <a className="sensi-lite-segment-atlas__exit" href="/">
          Exit
        </a>
      </header>

      <div className="sensi-lite-segment-atlas__stage">
        <SegmentLcd
          ref={lcdRef}
          lit={new Set()}
          atlas
          debug
          selectedKeys={selectedKeySet}
          namedRevision={namedRevision}
          onSegmentPick={handleSegmentPick}
        />
      </div>

      <SegmentLcdDebugPanel
        selectedPicks={selectedPicks}
        idDraft={idDraft}
        idCount={idCount}
        onIdDraftChange={setIdDraft}
        onApplyId={handleApplySegmentId}
        onBreakApart={handleBreakApart}
        canBreakApart={canBreakApart}
        onMerge={handleMerge}
        canMerge={canMerge}
        onCopyIdMap={handleCopyIdMap}
        onCopySvg={handleCopySvg}
        onClearPick={clearPick}
        onSelectAll={selectAllSegments}
      />
    </div>
  )
}
