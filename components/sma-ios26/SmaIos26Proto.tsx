import { ScrollEdgeChrome } from '@/components/sma-ios26/chrome/ScrollEdgeChrome'
import { TabBar } from '@/components/sma-ios26/chrome/TabBar'
import { StatusBar } from '@/components/sma-ios26/chrome/StatusBar'
import { TopToolbar } from '@/components/sma-ios26/chrome/TopToolbar'
import { AutomationScreen } from '@/components/sma-ios26/screens/AutomationScreen'
import { ControlScreen } from '@/components/sma-ios26/screens/ControlScreen'
import {
  DEFAULT_SMA_STATE,
  type SmaProtoState,
} from '@/lib/sma-ios26/state'
import type { SmaTabId } from '@/lib/sma-ios26/tokens'
import { useCallback, useEffect, useMemo, useState } from 'react'

const PLACEHOLDER_TITLES: Record<Exclude<SmaTabId, 'control' | 'schedule'>, string> = {
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
    (tab: SmaTabId) => {
      onStateChange({ activeTab: tab })
    },
    [onStateChange],
  )

  const body = useMemo(() => {
    if (state.activeTab === 'control') {
      return <ControlScreen state={state} onStateChange={onStateChange} />
    }
    if (state.activeTab === 'schedule') {
      return <AutomationScreen state={state} onStateChange={onStateChange} />
    }
    return <PlaceholderScreen title={PLACEHOLDER_TITLES[state.activeTab]} />
  }, [state, onStateChange])

  const isScheduleTab = state.activeTab === 'schedule'

  return (
    <div className={`sma-app${isScheduleTab ? ' sma-app--schedule-tab' : ''}`}>
      <div className="sma-app__bg" aria-hidden />
      <StatusBar />
      <div className="sma-app__main">
        {isScheduleTab ? <ScrollEdgeChrome /> : null}
        <TopToolbar />
        {body}
      </div>
      <TabBar activeTab={state.activeTab} onTabChange={onTabChange} />
    </div>
  )
}
