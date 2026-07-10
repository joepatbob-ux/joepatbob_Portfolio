/**
 * Schedule power switcher — On / Off (SMA iOS26 Automation, node 3025:5347).
 */
import { smaAsset } from '@/lib/sma-ios26/screen-spec'
import type { ScheduleMode } from '@/lib/sma-ios26/state'

const ON_OFF_MODES: { id: ScheduleMode; label: string; icon: string }[] = [
  { id: 'schedule', label: 'On', icon: smaAsset('schedule-program-icon.png') },
  { id: 'off', label: 'Off', icon: smaAsset('schedule-off-icon.png') },
]

const THREE_MODES: { id: ScheduleMode; label: string; icon: string }[] = [
  { id: 'schedule', label: 'Schedule', icon: smaAsset('schedule-program-icon.png') },
  { id: 'geofence', label: 'Geofence', icon: smaAsset('schedule-geofence-icon.png') },
  { id: 'off', label: 'Off', icon: smaAsset('schedule-off-icon.png') },
]

type ScheduleModeSegmentProps = {
  value: ScheduleMode
  onChange: (mode: ScheduleMode) => void
  /** Automation tab uses two-way On/Off; scheduling sheet uses three-way. */
  variant?: 'onOff' | 'three'
}

export function ScheduleModeSegment({
  value,
  onChange,
  variant = 'three',
}: ScheduleModeSegmentProps) {
  const modes = variant === 'onOff' ? ON_OFF_MODES : THREE_MODES
  const activeValue = variant === 'onOff' && value === 'geofence' ? 'schedule' : value

  return (
    <div className="sma-schedule-mode">
      <div className="sma-schedule-mode__control" role="tablist" aria-label="Automation mode">
        {modes.map((mode) => {
          const active = activeValue === mode.id
          return (
            <button
              key={mode.id}
              type="button"
              role="tab"
              aria-selected={active}
              className={`sma-schedule-mode__segment${active ? ' sma-schedule-mode__segment--active' : ''}`}
              onClick={() => onChange(mode.id)}
            >
              <img src={mode.icon} alt="" className="sma-schedule-mode__icon" draggable={false} />
            </button>
          )
        })}
      </div>
      <div className="sma-schedule-mode__labels" aria-hidden>
        {modes.map((mode) => (
          <span key={mode.id} className="sma-schedule-mode__label">
            {mode.label}
          </span>
        ))}
      </div>
    </div>
  )
}
