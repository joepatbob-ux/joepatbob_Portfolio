import { useCallback, useRef, useState } from 'react'
import type { SegmentLcdHandle } from '@/components/sensi-lite/SegmentLcd'
import {
  canBreakApartSegment,
  canMergeSegments,
  formatSegmentIdMap,
  mergeTargetIdFromSelection,
  type SegmentPick,
} from '@/lib/sensi-lite/sensiLiteSegmentDebug'

function idDraftFromSelection(picks: SegmentPick[]): string {
  if (picks.length === 0) return ''
  const ids = [...new Set(picks.map((p) => p.id).filter(Boolean))]
  if (ids.length === 1) return ids[0]
  return ''
}

export function useSegmentLcdDebug() {
  const lcdRef = useRef<SegmentLcdHandle>(null)
  const [selectedPicks, setSelectedPicks] = useState<SegmentPick[]>([])
  const [idDraft, setIdDraft] = useState('')
  const [namedRevision, setNamedRevision] = useState(0)
  const [idCount, setIdCount] = useState(0)

  const selectedKeys = selectedPicks.map((p) => p.key)

  const refreshIdCount = useCallback(() => {
    const count = Object.keys(lcdRef.current?.exportIdMap() ?? {}).length
    setIdCount(count)
    setNamedRevision((n) => n + 1)
    return count
  }, [])

  const handleSegmentPick = useCallback((pick: SegmentPick, additive: boolean) => {
    setSelectedPicks((prev) => {
      let next: SegmentPick[]
      if (additive) {
        const exists = prev.some((p) => p.key === pick.key)
        next = exists ? prev.filter((p) => p.key !== pick.key) : [...prev, pick]
      } else {
        next = [pick]
      }
      setIdDraft(idDraftFromSelection(next))
      return next
    })
  }, [])

  const handleApplySegmentId = useCallback(() => {
    if (selectedPicks.length === 0 || !idDraft.trim()) return
    const nextId = idDraft.trim()
    const keys = selectedPicks.map((p) => p.key)
    if (!lcdRef.current?.applyIds(keys, nextId)) return

    setSelectedPicks([
      {
        key: nextId,
        tag: keys.length > 1 ? 'g' : selectedPicks[0].tag,
        id: nextId,
        idx: null,
        className: keys.length > 1 ? 'lcd-seg-group' : selectedPicks[0].className,
      },
    ])
    refreshIdCount()
  }, [idDraft, refreshIdCount, selectedPicks])

  const handleBreakApart = useCallback(() => {
    if (selectedPicks.length !== 1) return
    const pick = selectedPicks[0]
    if (!canBreakApartSegment(pick)) return

    const released = lcdRef.current?.breakApart(pick.key) ?? []
    if (released.length === 0) return

    setSelectedPicks(released)
    setIdDraft('')
    refreshIdCount()
  }, [refreshIdCount, selectedPicks])

  const canBreakApart =
    selectedPicks.length === 1 && canBreakApartSegment(selectedPicks[0])

  const mergeTargetId = mergeTargetIdFromSelection(selectedPicks, idDraft)
  const canMerge = canMergeSegments(selectedPicks) && mergeTargetId !== null

  const handleMerge = useCallback(() => {
    if (!canMerge || !mergeTargetId) return
    const keys = selectedPicks.map((p) => p.key)
    const merged = lcdRef.current?.merge(keys, mergeTargetId)
    if (!merged) return

    setSelectedPicks([merged])
    setIdDraft(merged.id)
    refreshIdCount()
  }, [canMerge, mergeTargetId, refreshIdCount, selectedPicks])

  const handleCopyIdMap = useCallback(async () => {
    const map = lcdRef.current?.exportIdMap() ?? {}
    setIdCount(Object.keys(map).length)
    await navigator.clipboard.writeText(formatSegmentIdMap(map))
  }, [])

  const handleCopySvg = useCallback(async () => {
    const svg = lcdRef.current?.exportSvg() ?? ''
    if (svg) await navigator.clipboard.writeText(svg)
  }, [])

  const clearPick = useCallback(() => {
    setSelectedPicks([])
    setIdDraft('')
  }, [])

  const selectAllSegments = useCallback(() => {
    const picks = lcdRef.current?.collectAllPicks() ?? []
    setSelectedPicks(picks)
    setIdDraft(idDraftFromSelection(picks))
  }, [])

  return {
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
  }
}
