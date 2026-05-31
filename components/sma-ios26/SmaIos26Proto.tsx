'use client'

import { TabBar } from '@/components/sma-ios26/chrome/TabBar'
import { StatusBar } from '@/components/sma-ios26/chrome/StatusBar'
import { TopToolbar } from '@/components/sma-ios26/chrome/TopToolbar'
import { ControlScreen } from '@/components/sma-ios26/screens/ControlScreen'
import {
  DEFAULT_SMA_STATE,
  type SmaProtoState,
} from '@/lib/sma-ios26/state'
import type { SmaTabId } from '@/lib/sma-ios26/tokens'
import { useCallback, useEffect, useMemo, useState } from 'react'

const PLACEHOLDER_TITLES: Record<Exclude<SmaTabId, 'control'>, string> = {
  schedule: 'Schedule',
  usage: 'Usage',
  reminders: 'Reminders',
  settings: 'Settings',
}

function PlaceholderScreen({ title }: { title: string }) {
  return (
    <div className="sma-placeholder">
      <h2 className="sma-placeholder__title">{title}</h2>
      <p className="sma-placeholder__body">Screen coming soon.</p>
    </div>
  )
}

export function SmaIos26Proto({
  initialState = DEFAULT_SMA_STATE,
  onStateSnapshot,
}: {
  initialState?: SmaProtoState
  /** Fired after each state update (debug lab panel). */
  onStateSnapshot?: (state: SmaProtoState) => void
}) {
  const [state, setState] = useState(initialState)

  useEffect(() => {
    onStateSnapshot?.(initialState)
  }, [initialState, onStateSnapshot])

  const onStateChange = useCallback(
    (patch: Partial<SmaProtoState>) => {
      setState((prev) => {
        const next = { ...prev, ...patch }
        onStateSnapshot?.(next)
        return next
      })
    },
    [onStateSnapshot],
  )

  const onTabChange = useCallback(
    (activeTab: SmaTabId) => onStateChange({ activeTab }),
    [onStateChange],
  )

  const body = useMemo(() => {
    if (state.activeTab === 'control') {
      return <ControlScreen state={state} onStateChange={onStateChange} />
    }
    return (
      <PlaceholderScreen title={PLACEHOLDER_TITLES[state.activeTab]} />
    )
  }, [state, onStateChange])

  return (
    <div className="sma-app">
      <div className="sma-app__bg" aria-hidden />
      <StatusBar />
      <TopToolbar />
      {body}
      <TabBar activeTab={state.activeTab} onTabChange={onTabChange} />
    </div>
  )
}
