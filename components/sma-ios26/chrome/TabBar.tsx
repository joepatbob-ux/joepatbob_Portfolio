import { useLayoutEffect, useRef, useState } from 'react'
import { LiquidGlassSurface } from '@/components/sma-ios26/chrome/LiquidGlassSurface'
import { SmaFigmaIcon } from '@/components/sma-ios26/icons/SmaFigmaIcon'
import type { SmaSvgName } from '@/lib/sma-ios26/figma-assets'
import { SMA_TABS, type SmaTabId } from '@/lib/sma-ios26/tokens'

const TAB_ICON: Record<SmaTabId, SmaSvgName> = {
  control: 'tabControl',
  schedule: 'tabSchedule',
  usage: 'tabUsage',
  reminders: 'tabReminders',
  settings: 'tabSettings',
}

type TabBarProps = {
  activeTab: SmaTabId
  onTabChange: (tab: SmaTabId) => void
}

export function TabBar({ activeTab, onTabChange }: TabBarProps) {
  const trackRef = useRef<HTMLDivElement>(null)
  const btnRefs = useRef<Partial<Record<SmaTabId, HTMLButtonElement>>>({})
  const [selection, setSelection] = useState({ left: 0, width: 0 })

  useLayoutEffect(() => {
    const track = trackRef.current
    if (!track) return

    const measure = () => {
      const btn = btnRefs.current[activeTab]
      if (!btn) return
      // offsetLeft/Width stay in logical px; getBoundingClientRect is scaled by .sma-viewport__inner transform.
      setSelection({
        left: btn.offsetLeft,
        width: btn.offsetWidth,
      })
    }

    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(track)
    return () => ro.disconnect()
  }, [activeTab])

  return (
    <nav className="sma-tab-bar" aria-label="Main">
      <LiquidGlassSurface className="sma-tab-bar__track" variant="pill">
        <div ref={trackRef} className="sma-tab-bar__buttons">
          <div
            className="sma-tab-bar__selection"
            aria-hidden
            style={{
              left: selection.left,
              width: selection.width,
            }}
          />
          {SMA_TABS.map(({ id, label }) => {
            const active = id === activeTab
            const color = active ? '#0088ff' : '#1a1a1a'
            return (
              <button
                key={id}
                ref={(el) => {
                  if (el) btnRefs.current[id] = el
                }}
                type="button"
                className={`sma-tab-bar__btn${active ? ' sma-tab-bar__btn--active' : ''}`}
                aria-current={active ? 'page' : undefined}
                onClick={() => onTabChange(id)}
              >
                <span className="sma-tab-bar__icon">
                  <SmaFigmaIcon name={TAB_ICON[id]} size={20} color={color} />
                </span>
                <span className="sma-tab-bar__label">{label}</span>
              </button>
            )
          })}
        </div>
      </LiquidGlassSurface>
    </nav>
  )
}
