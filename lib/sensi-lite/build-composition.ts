import { SEG_PARTS, SEGS } from '@/lib/sensi-lite/lcd-segments'
import {
  ICON_IDS,
  LABEL_IDS,
  digitSegmentId,
  type DigitPosition,
  type SegmentId,
} from '@/lib/sensi-lite/segment-ids'

export type Mode = 'heat' | 'cool' | 'off'

function addDigitSegments(target: Set<SegmentId>, position: DigitPosition, value: number) {
  const pattern = SEGS[value]
  if (!pattern) return
  SEG_PARTS.forEach((seg, index) => {
    if (pattern[index]) target.add(digitSegmentId(position, seg))
  })
}

function addDashDigits(target: Set<SegmentId>) {
  target.add(digitSegmentId('tens', 'mid'))
  target.add(digitSegmentId('ones', 'mid'))
}

function addGroupChildrenIds(groupId: string, target: Set<SegmentId>) {
  target.add(groupId)
}

export function buildTempDisplay(target: Set<SegmentId>, value: number | null) {
  if (value === null) {
    addDashDigits(target)
    return
  }
  const clamped = Math.min(99, Math.max(-99, Math.round(value)))
  const tens = Math.floor(Math.abs(clamped) / 10)
  const ones = Math.abs(clamped) % 10
  addDigitSegments(target, 'tens', tens)
  addDigitSegments(target, 'ones', ones)
}

export function buildHomeComposition({
  temp,
  mode,
  onActive,
  showSetTo,
}: {
  temp: number
  mode: Mode
  onActive: boolean
  showSetTo?: boolean
}): Set<SegmentId> {
  const lit = new Set<SegmentId>()
  const tens = Math.floor(temp / 10)
  const ones = temp % 10
  addDigitSegments(lit, 'tens', tens)
  addDigitSegments(lit, 'ones', ones)

  if (showSetTo) addGroupChildrenIds(ICON_IDS.setTo, lit)
  if (mode === 'heat') lit.add(ICON_IDS.auxHeat)
  if (mode === 'cool') addGroupChildrenIds(ICON_IDS.cool, lit)
  if (mode === 'off') addGroupChildrenIds(ICON_IDS.off, lit)
  if (onActive) {
    lit.add(ICON_IDS.onDegree)
    lit.add(ICON_IDS.onText)
  }

  return lit
}

export const HOMEOWNER_SCREEN_LABELS: Record<string, readonly SegmentId[]> = {
  wifi: [ICON_IDS.wifi],
  display: [ICON_IDS.percent],
  fan: [ICON_IDS.fan],
  units: [LABEL_IDS.setup],
}

export const CONTRACTOR_SCREEN_LABELS: Record<string, readonly SegmentId[]> = {
  outdoor: [LABEL_IDS.outdoor, LABEL_IDS.setto],
  auxLockout: [LABEL_IDS.aux, ICON_IDS.auxHeat, ICON_IDS.cool],
  balancePoint: [LABEL_IDS.setup, LABEL_IDS.setto],
}

export function buildSettingsComposition(
  screenKey: keyof typeof HOMEOWNER_SCREEN_LABELS | keyof typeof CONTRACTOR_SCREEN_LABELS,
  ring: 'homeowner' | 'contractor',
  temp: number | null,
): Set<SegmentId> {
  const lit = new Set<SegmentId>()
  const labels =
    ring === 'homeowner'
      ? HOMEOWNER_SCREEN_LABELS[screenKey as keyof typeof HOMEOWNER_SCREEN_LABELS]
      : CONTRACTOR_SCREEN_LABELS[screenKey as keyof typeof CONTRACTOR_SCREEN_LABELS]

  if (labels) labels.forEach((id) => lit.add(id))

  if (ring === 'contractor' && (screenKey === 'auxLockout' || screenKey === 'balancePoint')) {
    buildTempDisplay(lit, temp)
  }

  return lit
}
